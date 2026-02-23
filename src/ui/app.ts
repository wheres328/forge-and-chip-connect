import blessed from 'blessed';
import { GitHubClient, GitHubRelease, GitHubAsset } from '../github/client.js';
import { 
  categories, 
  getRepositoriesByCategory, 
  searchRepositories,
  RepositoryConfig 
} from '../config/repositories.js';
import { DownloadManager } from '../download/manager.js';

type Screen = 'home' | 'category' | 'items' | 'downloads' | 'settings';

interface AppState {
  currentScreen: Screen;
  selectedCategory: string | null;
  selectedRepo: RepositoryConfig | null;
  releases: GitHubRelease[];
  selectedAsset: GitHubAsset | null;
  searchQuery: string;
  isLoading: boolean;
  loadingMessage: string;
}

const COLORS = {
  primary: '#FF6B35',
  secondary: '#004E89',
  accent: '#1A936F',
  background: '#0d1117',
  surface: '#161b22',
  text: '#c9d1d9',
  textMuted: '#8b949e',
  success: '#238636',
  error: '#da3633',
  border: '#30363d'
};

export class TUIApp {
  private screen: blessed.Widgets.Screen;
  private client: GitHubClient;
  private downloadManager: DownloadManager;
  private state: AppState;

  private headerBox: any;
  private mainBox: any;
  private footerBox: any;
  private listBox: any;
  private logBox: any;
  private progressBar: any;

  constructor() {
    this.client = new GitHubClient();
    this.downloadManager = new DownloadManager();
    
    this.state = {
      currentScreen: 'home',
      selectedCategory: null,
      selectedRepo: null,
      releases: [],
      selectedAsset: null,
      searchQuery: '',
      isLoading: false,
      loadingMessage: ''
    };

    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Forge&Chip.Connect',
      autoPadding: true,
      dockBorders: true,
      fullUnicode: true
    });

    this.headerBox = this.createHeader();
    this.mainBox = this.createMainArea();
    this.footerBox = this.createFooter();
    this.listBox = this.mainBox.children[0] as any;
    this.progressBar = this.mainBox.children[1] as any;
    this.logBox = this.mainBox.children[2] as any;

    this.setupKeyBindings();
    this.render();
  }

  private createHeader(): blessed.Widgets.BoxElement {
    const header = blessed.box({
      top: 0,
      left: 0,
      right: 0,
      height: 7,
      style: {
        bg: COLORS.surface,
        border: { fg: COLORS.border },
        fg: COLORS.text
      },
      tags: true
    });

    const logo = blessed.box({
      parent: header,
      top: 0,
      left: 0,
      right: 0,
      height: 4,
      content: `
  ██████╗ ██████╗ ██████╗ ███████╗    ██████╗  ██████╗ ███████╗ █████╗ ████████╗██╗██╗   ██╗███████╗
  ██╔══██╗██╔══██╗██╔══██╗██╔════╝   ██╔═══██╗██╔═══██╗██╔════╝██╔══██╗╚══██╔══╝██║██║   ██║██╔════╝
  ██║  ██║██████╔╝██║  ██║█████╗     ██║   ██║██║   ██║█████╗  ███████║   ██║   ██║██║   ██║█████╗  
  ██║  ██║██╔══██╗██║  ██║██╔══╝     ██║   ██║██║   ██║██╔══╝  ██╔══██║   ██║   ██║╚██╗ ██╔╝██╔══╝  
  ██████╔╝██║  ██║██████╔╝███████╗   ╚██████╔╝╚██████╔╝██║     ██║  ██║   ██║   ██║ ╚████╔╝ ███████╗
  ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚══════╝    ╚═════╝  ╚═════╝ ╚═╝     ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═══╝ ╚══════╝
      `,
      align: 'center',
      valign: 'middle',
      tags: true
    });

    const subtitle = blessed.box({
      parent: header,
      top: 4,
      left: 0,
      right: 0,
      height: 2,
      content: ' {bold}Download drivers and programs from GitHub{/bold} ',
      align: 'center',
      style: {
        fg: COLORS.textMuted
      }
    });

    const borderLine = blessed.box({
      parent: header,
      bottom: 0,
      left: 0,
      right: 0,
      height: 1,
      style: {
        bg: COLORS.primary,
        fg: COLORS.primary
      },
      content: ' '.repeat(100)
    });

    this.screen.append(header);
    return header;
  }

  private createMainArea(): blessed.Widgets.BoxElement {
    const main = blessed.box({
      top: 7,
      left: 0,
      right: 0,
      bottom: 3,
      style: {
        bg: COLORS.background,
        fg: COLORS.text
      }
    });

    const list = blessed.list({
      parent: main,
      top: 0,
      left: 0,
      width: '100%',
      height: '70%',
      style: {
        selected: { bg: COLORS.primary, fg: COLORS.background, bold: true },
        item: { fg: COLORS.text },
        hover: { bg: COLORS.surface, fg: COLORS.text }
      },
      keys: true,
      vi: true,
      mouse: true,
      border: { type: 'line' }
    });

    const progress = blessed.progressbar({
      parent: main,
      top: '70%',
      left: 0,
      width: '100%',
      height: 3,
      style: {
        bar: { bg: COLORS.accent },
        track: { bg: COLORS.surface },
        text: { fg: COLORS.text }
      },
      hidden: true,
      filled: 0,
      label: 'Downloading...'
    });

    const log = blessed.box({
      parent: main,
      top: '80%',
      left: 0,
      width: '100%',
      height: '20%',
      style: {
        fg: COLORS.textMuted,
        bg: COLORS.surface,
        border: { fg: COLORS.border }
      },
      scrollable: true,
      tags: true
    });

    this.screen.append(main);
    return main;
  }

  private createFooter(): blessed.Widgets.BoxElement {
    const footer = blessed.box({
      bottom: 0,
      left: 0,
      right: 0,
      height: 3,
      style: {
        bg: COLORS.surface,
        border: { fg: COLORS.border }
      }
    });

    const helpText = blessed.box({
      parent: footer,
      top: 0,
      left: 0,
      right: 0,
      height: 1,
      content: ' {bold}↑↓{/bold} Navigate  {bold}Enter{/bold} Select  {bold}Esc{/bold} Back  {bold}s{/bold} Search  {bold}q{/bold} Quit ',
      align: 'center',
      style: {
        fg: COLORS.textMuted
      }
    });

    const version = blessed.box({
      parent: footer,
      bottom: 0,
      left: 0,
      right: 0,
      height: 1,
      content: ' v1.0.0 ',
      style: {
        fg: COLORS.textMuted
      }
    });

    this.screen.append(footer);
    return footer;
  }

  private setupKeyBindings(): void {
    this.screen.key(['escape', 'q', 'Q'], () => {
      this.handleBack();
    });

    this.screen.key(['enter'], () => {
      this.handleSelect();
    });

    this.screen.key(['s', 'S'], () => {
      this.showSearch();
    });

    this.screen.key(['r', 'R'], () => {
      this.refreshData();
    });

    this.screen.key(['d', 'D'], () => {
      this.showDownloads();
    });

    this.listBox.on('select', () => {
      // Item selected
    });
  }

  private getSelectedIndex(): number {
    return (this.listBox as any).selected || 0;
  }

  private async handleSelect(): Promise<void> {
    const index = this.getSelectedIndex();

    if (this.state.currentScreen === 'home') {
      if (categories[index]) {
        this.state.selectedCategory = categories[index].id;
        this.state.currentScreen = 'category';
        await this.loadCategoryItems(categories[index].id);
      }
    } else if (this.state.currentScreen === 'category') {
      const repos = getRepositoriesByCategory(this.state.selectedCategory!);
      if (repos[index]) {
        this.state.selectedRepo = repos[index];
        this.state.currentScreen = 'items';
        await this.loadReleases(repos[index]);
      }
    } else if (this.state.currentScreen === 'items') {
      if (this.state.releases[index]) {
        const assets = this.state.releases[index].assets;
        if (assets.length > 0) {
          this.state.selectedAsset = assets[0];
          await this.downloadSelected();
        }
      }
    }
  }

  private handleBack(): void {
    if (this.state.currentScreen === 'home') {
      this.exit();
    } else if (this.state.currentScreen === 'items') {
      this.state.currentScreen = 'category';
      this.state.releases = [];
      this.renderList();
    } else if (this.state.currentScreen === 'category') {
      this.state.currentScreen = 'home';
      this.state.selectedCategory = null;
      this.renderList();
    } else if (this.state.currentScreen === 'downloads' || this.state.currentScreen === 'settings') {
      this.state.currentScreen = 'home';
      this.renderList();
    }
  }

  private async showSearch(): Promise<void> {
    const searchBox = blessed.prompt({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: '50%',
      height: 'shrink',
      border: { type: 'line' },
      style: {
        fg: COLORS.text,
        bg: COLORS.surface
      }
    });

    searchBox.input('Search programs/drivers: ', '', (err, value) => {
      if (value && value.trim()) {
        this.state.searchQuery = value;
        this.performSearch(value);
      }
    });
  }

  private performSearch(query: string): void {
    const results = searchRepositories(query);
    this.log(`Found ${results.length} results for "${query}"`);
    
    if (results.length > 0) {
      this.state.currentScreen = 'category';
      this.state.selectedCategory = 'search';
      this.renderListFromRepos(results);
    }
  }

  private async refreshData(): Promise<void> {
    this.log('Refreshing data...');
    if (this.state.selectedCategory) {
      await this.loadCategoryItems(this.state.selectedCategory);
    }
    this.log('Data refreshed!');
  }

  private showDownloads(): void {
    const path = this.downloadManager.getDownloadPath();
    this.log(`Downloads saved to: ${path}`);
    this.state.currentScreen = 'downloads';
    
    this.listBox.setItems([
      `📂 Download Directory: ${path}`,
      '---',
      ' Press Enter to open folder '
    ]);
  }

  private async loadCategoryItems(categoryId: string): Promise<void> {
    this.setLoading(true, `Loading ${categoryId}...`);
    
    try {
      const repos = getRepositoriesByCategory(categoryId);
      this.renderListFromRepos(repos);
    } catch (error) {
      this.log(`Error: ${(error as Error).message}`);
    } finally {
      this.setLoading(false);
    }
  }

  private async loadReleases(repo: RepositoryConfig): Promise<void> {
    this.setLoading(true, `Fetching releases from ${repo.name}...`);
    
    try {
      const release = await this.client.getLatestRelease(repo.owner, repo.repo);
      if (release) {
        this.state.releases = [release];
        this.renderReleaseItems(release);
      } else {
        this.log('No releases found');
        this.listBox.setItems(['No releases available']);
      }
    } catch (error) {
      this.log(`Error: ${(error as Error).message}`);
    } finally {
      this.setLoading(false);
    }
  }

  private async downloadSelected(): Promise<void> {
    if (!this.state.selectedAsset) return;

    const asset = this.state.selectedAsset;
    this.log(`Downloading: ${asset.name}`);
    this.progressBar.show();

    try {
      const filePath = await this.downloadManager.downloadFile(
        asset.browser_download_url,
        asset.name,
        (progress) => {
          this.progressBar.setProgress(progress.percent);
          this.progressBar.setLabel(`Downloading ${asset.name} - ${progress.percent}%`);
          this.screen.render();
        }
      );
      
      this.log(`✓ Downloaded to: ${filePath}`);
    } catch (error) {
      this.log(`✗ Download failed: ${(error as Error).message}`);
    } finally {
      this.progressBar.hide();
      this.screen.render();
    }
  }

  private renderListFromRepos(repos: RepositoryConfig[]): void {
    const items = repos.map(repo => 
      ` {${COLORS.accent}}📦{/} {bold}${repo.name}{/}  \n   ${repo.description}`
    );
    this.listBox.setItems(items);
    this.screen.render();
  }

  private renderReleaseItems(release: GitHubRelease): void {
    const items = release.assets.map(asset => {
      const size = this.downloadManager.formatBytes(asset.size);
      return ` {${COLORS.primary}}📄{/} {bold}${asset.name}{/}\n   Size: ${size} | Downloads: ${asset.download_count}`;
    });
    
    if (items.length === 0) {
      this.listBox.setItems(['No files available in this release']);
    } else {
      this.listBox.setItems(items);
    }
    this.screen.render();
  }

  private setLoading(loading: boolean, message: string = ''): void {
    this.state.isLoading = loading;
    this.state.loadingMessage = message;
    if (loading) {
      this.log(message);
    }
  }

  private log(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    const existing = this.logBox.content || '';
    this.logBox.setContent(`${existing}\n[${timestamp}] ${message}`);
    this.screen.render();
  }

  private render(): void {
    this.renderList();
    this.screen.render();
  }

  private renderList(): void {
    if (this.state.currentScreen === 'home') {
      const items = categories.map(cat => 
        ` {${COLORS.primary}}${cat.icon}{/} {bold}${cat.name}{/}\n   ${cat.description}`
      );
      this.listBox.setItems(items);
    }
    this.screen.render();
  }

  private exit(): void {
    this.screen.destroy();
    process.exit(0);
  }

  public run(): void {
    this.log('Welcome to Forge&Chip.Connect!');
    this.log('Use arrow keys to navigate and Enter to select.');
    this.render();
  }
}
