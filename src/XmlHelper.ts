import { BOT_FORMAT } from '@/constants/bot-format';

export class XmlHelper {
    static loadXml(xmlString: string): Document {
        const parser = new DOMParser();
        return parser.parseFromString(xmlString, 'text/xml');
    }

    static saveXml(doc: Document): string {
        try {
            let xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n';
            xmlString += this.formatXml(new XMLSerializer().serializeToString(doc));
            return xmlString;
        } catch (error) {
            console.error('Error saving XML:', error);
            throw error;
        }
    }

    private static formatXml(xml: string): string {
        let formatted = '';
        let indent = '';
        const tab = '    ';
        xml.split(/>\s*</).forEach(node => {
            if (node.match(/^\/\w/)) {
                indent = indent.substring(tab.length);
            }
            formatted += indent + '<' + node + '>\n';
            if (node.match(/^<?\w[^>]*[^\/]$/)) {
                indent += tab;
            }
        });
        return formatted.substring(1, formatted.length - 2);
    }

    static generateXMLContent(values: { [key: string]: any }): string {
        try {
            const doc = new DOMParser().parseFromString(
                '<?xml version="1.0" encoding="UTF-8"?><appConfig version="1.0"></appConfig>',
                'text/xml'
            );
            
            const rootNode = doc.documentElement;
            const settingsNode = doc.createElement('settings');
            
            Object.entries(values).forEach(([key, value]) => {
                if (key !== 'is_local' && value !== undefined) {
                    const settingNode = doc.createElement('setting');
                    settingNode.setAttribute('name', key);
                    settingNode.setAttribute('value', String(value));
                    settingsNode.appendChild(settingNode);
                }
            });
            
            rootNode.appendChild(settingsNode);
            return this.saveXml(doc);
        } catch (error) {
            console.error('Error generating XML content:', error);
            throw error;
        }
    }

    static getSetting(doc: Document, settingName: string): string | null {
        const setting = doc.querySelector(`setting[name="${settingName}"]`);
        return setting?.getAttribute('value') || null;
    }

    static setSetting(doc: Document, settingName: string, value: string): void {
        const setting = doc.querySelector(`setting[name="${settingName}"]`);
        if (setting) {
            setting.setAttribute('value', value);
        } else {
            const settings = doc.querySelector('settings');
            if (settings) {
                const newSetting = doc.createElement('setting');
                newSetting.setAttribute('name', settingName);
                newSetting.setAttribute('value', value);
                settings.appendChild(newSetting);
            }
        }
    }

    static generateBotFormat(values: any, blocksXml: string): string {
        try {
            const doc = new DOMParser().parseFromString(
                '<?xml version="1.0" encoding="UTF-8"?><botFormat></botFormat>',
                'text/xml'
            );
            
            // Add metadata
            const metadata = doc.createElement('metadata');
            metadata.setAttribute('name', values.bot_name);
            metadata.setAttribute('version', '1.0');
            metadata.setAttribute('created', new Date().toISOString());
            metadata.setAttribute('modified', new Date().toISOString());
            
            // Add workspace with blocks
            const workspace = doc.createElement('workspace');
            const blocks = doc.createElement('blocks');
            blocks.textContent = btoa(blocksXml); // Base64 encode blocks XML
            
            workspace.appendChild(blocks);
            
            // Add variables if they exist
            if (values.variables) {
                const variables = doc.createElement('variables');
                variables.textContent = btoa(JSON.stringify(values.variables));
                workspace.appendChild(variables);
            }
            
            const rootNode = doc.documentElement;
            rootNode.appendChild(metadata);
            rootNode.appendChild(workspace);
            
            return this.saveXml(doc).replace('<?xml', '<?bfx');
        } catch (error) {
            console.error('Error generating BFX content:', error);
            throw error;
        }
    }

    static loadBotFormat(bfxString: string): { metadata: any, blocksXml: string, variables?: any } {
        try {
            const xmlString = bfxString.replace('<?bfx', '<?xml');
            const doc = this.loadXml(xmlString);
            
            const metadata = doc.querySelector('metadata');
            const blocks = doc.querySelector('blocks');
            const variables = doc.querySelector('variables');
            
            return {
                metadata: {
                    name: metadata?.getAttribute('name'),
                    version: metadata?.getAttribute('version'),
                    created: metadata?.getAttribute('created'),
                    modified: metadata?.getAttribute('modified'),
                },
                blocksXml: blocks ? atob(blocks.textContent || '') : '',
                variables: variables ? JSON.parse(atob(variables.textContent || '')) : undefined
            };
        } catch (error) {
            console.error('Error loading BFX content:', error);
            throw error;
        }
    }

    static downloadBotFile(content: string, filename: string): void {
        const blob = new Blob([content], { type: 'application/x-bfx' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename + BOT_FORMAT.extension;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}
