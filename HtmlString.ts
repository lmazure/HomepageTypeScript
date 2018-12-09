export default class HtmlString {

    private html: string;

    private constructor() {
        this.html = "";
    }

    public static buildEmpty(): HtmlString {
        const that: HtmlString = new HtmlString();
        return that;
    }

    public static buildFromString(str: string | HtmlString): HtmlString {
        const that: HtmlString = new HtmlString();
        that.appendString(str);
        return that;
    }

    public static buildFromTag(tag: string, content: string | HtmlString, ...attributes: string[]) {
        const that: HtmlString = new HtmlString();
        that.performTagAppending(tag, content, attributes);
        return that;
    }

    public getHtml(): string {
        return this.html;
    }

    public isEmpty(): boolean {
        return (this.html.length === 0);
    }

    public appendString(str: string | HtmlString): HtmlString {
        this.html += (typeof str === "string") ? HtmlString.escape(str) : (str as HtmlString).getHtml();
        return this;
    }

    public appendEmptyTag(tag: string): HtmlString {
        this.html += "<" + tag + ">";
        return this;
    }

    public appendTag(tag: string, content: string | HtmlString, ...attributes: string[]): HtmlString {
        this.performTagAppending(tag, content, attributes);
        return this;
    }

    private performTagAppending(tag: string, content: string | HtmlString, attributes: string[]): void {
        if ((attributes.length % 2) !== 0) {
            throw "illegal call to HtmlString.performTagAppending()";
        }
        let str = "<" + tag;
        for (let i: number = 0; i < attributes.length; i += 2) {
            str += " " + attributes[i] + "=\"" + HtmlString.escapeAttributeValue(attributes[i + 1]) + "\"";
        }
        str += ">"
                + ((typeof content === "string") ? HtmlString.escape(content) : (content as HtmlString).getHtml())
                + "</"
                + tag
                + ">";
        this.html += str;
    }

    private static escape(unsafe: string): string {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
     }

     private static escapeAttributeValue(unsafe: string): string {
        return unsafe.replace(/"/g, "&quot;");
     }
}
