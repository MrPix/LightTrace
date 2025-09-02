class LightTraceUI {
    constructor() {
        this.basePath = this.getBasePath();
        this.lastUpdateTime = null;
        this.init();
    }

    getBasePath() {
        // Use the injected configuration if available
        if (window.LightTraceConfig && window.LightTraceConfig.basePath) {
            console.log('LightTrace UI: Using server-injected base path:', window.LightTraceConfig.basePath);
            return window.LightTraceConfig.basePath;
        }

        // Fallback: Get the base path from the current URL
        console.log('LightTrace UI: Using fallback base path detection');
        const path = window.location.pathname;
        const segments = path.split('/').filter(segment => segment);
        
        // If we're at /lighttrace or /lighttrace/, return /lighttrace
        if (segments.length > 0) {
            const detectedPath = '/' + segments[0];
            console.log('LightTrace UI: Detected base path from URL:', detectedPath);
            return detectedPath;
        }
        
        // Final fallback
        console.log('LightTrace UI: Using final fallback base path: /lighttrace');
        return '/lighttrace';
    }

    init() {
        this.bindEvents();
        this.loadInitialData();
        
        // Auto-refresh every 30 seconds
        setInterval(() => {
            this.refreshTraces();
        }, 15000);
    }

    bindEvents() {
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.refreshAll();
        });

        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadReport();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetTraces();
        });
    }

    async loadInitialData() {
        await Promise.all([
            this.loadTraces(),
            this.loadConfiguration()
        ]);
    }

    async refreshAll() {
        this.showToast('Refreshing data...', 'info');
        await Promise.all([
            this.refreshTraces(),
            this.refreshConfiguration()
        ]);
        this.showToast('Data refreshed successfully', 'success');
    }

    async loadTraces() {
        this.showLoading('tracesLoading', true);
        this.hideError('tracesError');
        
        try {
            const response = await fetch(`${this.basePath}/api/traces`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const markdownContent = await response.text();
            this.renderMarkdown(markdownContent);
            this.updateLastUpdated();
            
        } catch (error) {
            console.error('Error loading traces:', error);
            this.showError('tracesError', `Failed to load traces: ${error.message}`);
            this.showEmptyState('tracesContent', 'No traces available', 'Unable to load trace data. Please check your connection and try again.');
        } finally {
            this.showLoading('tracesLoading', false);
        }
    }

    async refreshTraces() {
        await this.loadTraces();
    }

    async loadConfiguration() {
        this.showLoading('configLoading', true);
        this.hideError('configError');
        
        try {
            const response = await fetch(`${this.basePath}/api/traces/configuration`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const config = await response.json();
            this.renderConfiguration(config);
            
        } catch (error) {
            console.error('Error loading configuration:', error);
            this.showError('configError', `Failed to load configuration: ${error.message}`);
            this.showEmptyState('configContent', 'Configuration unavailable', 'Unable to load configuration data.');
        } finally {
            this.showLoading('configLoading', false);
        }
    }

    async refreshConfiguration() {
        await this.loadConfiguration();
    }

    async downloadReport() {
        try {
            this.setButtonLoading('downloadBtn', true);
            
            const response = await fetch(`${this.basePath}/api/traces/download`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `LightTrace_Report_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            this.showToast('Report downloaded successfully', 'success');
            
        } catch (error) {
            console.error('Error downloading report:', error);
            this.showToast(`Failed to download report: ${error.message}`, 'error');
        } finally {
            this.setButtonLoading('downloadBtn', false);
        }
    }

    async resetTraces() {
        if (!confirm('Are you sure you want to reset all traces? This action cannot be undone.')) {
            return;
        }

        try {
            this.setButtonLoading('resetBtn', true);
            
            const response = await fetch(`${this.basePath}/api/traces/reset`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.showToast('Traces reset successfully', 'success');
            
            // Refresh traces after reset
            setTimeout(() => {
                this.refreshTraces();
            }, 500);
            
        } catch (error) {
            console.error('Error resetting traces:', error);
            this.showToast(`Failed to reset traces: ${error.message}`, 'error');
        } finally {
            this.setButtonLoading('resetBtn', false);
        }
    }

    renderMarkdown(markdownContent) {
        const contentElement = document.getElementById('tracesContent');
        
        if (!markdownContent || markdownContent.trim() === '') {
            this.showEmptyState('tracesContent', 'No traces yet', 'Start using your application to see trace data here.');
            return;
        }

        try {
            const htmlContent = marked.parse(markdownContent);
            contentElement.innerHTML = htmlContent;
            contentElement.className = 'markdown-content';
        } catch (error) {
            console.error('Error rendering markdown:', error);
            this.showError('tracesError', `Failed to render markdown: ${error.message}`);
        }
    }

    renderConfiguration(config) {
        const contentElement = document.getElementById('configContent');
        
        if (!config || typeof config !== 'object') {
            this.showEmptyState('configContent', 'No configuration', 'Configuration data is not available.');
            return;
        }

        const configHtml = Object.entries(config)
            .map(([key, value]) => {
                const displayValue = typeof value === 'object' 
                    ? JSON.stringify(value, null, 2) 
                    : String(value);
                
                return `
                    <div class="config-item">
                        <div class="config-key">${this.escapeHtml(key)}</div>
                        <div class="config-value">${this.escapeHtml(displayValue)}</div>
                    </div>
                `;
            })
            .join('');

        contentElement.innerHTML = configHtml;
        contentElement.className = 'config-content';
    }

    showLoading(elementId, show) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = show ? 'flex' : 'none';
        }
    }

    showError(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
        }
    }

    hideError(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'none';
        }
    }

    showEmptyState(elementId, title, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="empty-state">
                    <h3>${this.escapeHtml(title)}</h3>
                    <p>${this.escapeHtml(message)}</p>
                </div>
            `;
            element.className = '';
        }
    }

    setButtonLoading(buttonId, loading) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = loading;
            if (loading) {
                button.dataset.originalText = button.innerHTML;
                button.innerHTML = '<span class="icon">?</span> Loading...';
            } else {
                button.innerHTML = button.dataset.originalText || button.innerHTML;
            }
        }
    }

    updateLastUpdated() {
        const element = document.getElementById('lastUpdated');
        if (element) {
            this.lastUpdateTime = new Date();
            element.textContent = this.lastUpdateTime.toLocaleString();
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.className = `toast ${type}`;
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.lightTraceUI = new LightTraceUI();
});

// Handle potential errors
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});