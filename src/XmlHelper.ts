import { DOMParser, XMLSerializer } from 'xmldom';
import * as fs from 'fs';

export class XmlHelper {
    static loadXml(filePath: string): Document {
        const xmlContent = fs.readFileSync(filePath, 'utf-8');
        const parser = new DOMParser();
        return parser.parseFromString(xmlContent, 'text/xml');
    }

    static saveXml(doc: Document, filePath: string): void {
        try {
            const serializer = new XMLSerializer();
            let xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n';
            xmlString += this.formatXml(serializer.serializeToString(doc));
            fs.writeFileSync(filePath, xmlString, 'utf-8');
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
