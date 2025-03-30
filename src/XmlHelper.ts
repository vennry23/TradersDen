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
}
