import { parseHTML as linkedomParseHTML } from 'linkedom';

export function parseHTML(html: string) {
    return linkedomParseHTML(html);
}