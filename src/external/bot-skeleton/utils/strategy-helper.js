import crypto from 'crypto';

/** Helper function to generate a unique block signature */
const generateSignature = (block) => {
    const data = block.type + JSON.stringify(block.fields);
    return crypto.createHash('sha256').update(data).digest('hex');
};

/** Helper function to parse block information from XML */
export const extractBlocksFromXml = xml => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, 'text/xml');
    const blocks = xmlDoc.getElementsByTagName('block');

    return Array.from(blocks).map(block => {
        const type = block.getAttribute('type');
        const fields = Array.from(block.getElementsByTagName('field')).map(field => ({
            name: field.getAttribute('name'),
            value: field.textContent.trim(),
        }));

        return { 
            type, 
            fields,
            signature: generateSignature({ type, fields }) // Add signature
        };
    });
};

/** Helper function to sort blocks based on type or field name */
export const sortBlockChild = blocksArray =>
    blocksArray.sort((a, b) => {
        if (a.type < b.type) return -1;
        if (a.type > b.type) return 1;
        return JSON.stringify(a.fields) < JSON.stringify(b.fields) ? -1 : 1;
    });

/** Compare two sets of blocks by their signatures */
export const compareXml = (xml1, xml2) => {
    const sortedBlocks1 = sortBlockChild(extractBlocksFromXml(xml1));
    const sortedBlocks2 = sortBlockChild(extractBlocksFromXml(xml2));

    if (sortedBlocks1.length !== sortedBlocks2.length) {
        return false;
    }

    return sortedBlocks1.every((block, index) => block.signature === sortedBlocks2[index].signature);
};
