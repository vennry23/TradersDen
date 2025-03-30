import { DOMParser, XMLSerializer } from 'xmldom';
import * as fs from 'fs';

export class XmlHelper {
    static loadXml(filePath: string): Document {
        const xmlContent = fs.readFileSync(filePath, 'utf-8');
        const parser = new DOMParser();
        return parser.parseFromString(xmlContent, 'text/xml');
    }

    static saveXml(doc: Document, filePath: string): void {
        const serializer = new XMLSerializer();
        const xmlString = serializer.serializeToString(doc);
        fs.writeFileSync(filePath, xmlString, 'utf-8');
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

    static saveBotFormat(blocksXml: string, values: { [key: string]: any }): string {
        try {
            const doc = new DOMParser().parseFromString(
                '<?xml version="1.0" encoding="UTF-8"?><bfx format="3"></bfx>',
                'text/xml'
            );
            const metadata = doc.createElement('metadata');
            Object.entries(values).forEach(([key, value]) => {
                const settingNode = doc.createElement('setting');
                settingNode.setAttribute('name', key);
                settingNode.setAttribute('value', String(value));
                metadata.appendChild(settingNode);
            });

            const workspace = doc.createElement('workspace');
            const blocks = doc.createElement('blocks');
            blocks.textContent = btoa(blocksXml); // Base64 encode blocks XML
            workspace.appendChild(blocks);

            if (values.variables) {
                const variables = doc.createElement('variables');
                variables.textContent = btoa(JSON.stringify(values.variables));
                workspace.appendChild(variables);
            }

            doc.documentElement.appendChild(metadata);
            doc.documentElement.appendChild(workspace);

            return this.saveXml(doc).replace('<?xml', '<?bfx');
        } catch (error) {
            console.error('Error saving BFX content:', error);
            throw error;
        }
    }

    static loadBotFormat(bfxString: string): { metadata: any; blocksXml: string; variables?: any } {
        try {
            const xmlString = bfxString.replace('<?bfx', '<?xml');
            const doc = this.loadXml(xmlString);

            const metadata = doc.querySelector('metadata');
            const blocks = doc.querySelector('blocks');
            const variables = doc.querySelector('variables');

            return {
                metadata: Array.from(metadata?.children || []).reduce((acc, setting) => {
                    acc[setting.getAttribute('name') || ''] = setting.getAttribute('value');
                    return acc;
                }, {}),
                blocksXml: blocks ? atob(blocks.textContent || '') : '',
                variables: variables ? JSON.parse(atob(variables.textContent || '')) : undefined,
            };
        } catch (error) {
            console.error('Error loading BFX content:', error);
            throw error;
        }
    }
}
