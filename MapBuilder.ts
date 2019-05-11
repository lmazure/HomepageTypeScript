import HtmlString from "./HtmlString.js";
import { MapNode } from "./DataLoader.js";

export class MapBuilder {

    private divCounter: number = 0;
    private static openedNodeSymbol: string = "\u25BC";
    private static closedNodeSymbol: string = "\u25BA";
    private static spanDivName: string = "spanDiv";
    private static toggleDivName: string = "toggleDiv";

    // constructor() {
    // }

    private buildMap(): void  {
        const mapRequest = new XMLHttpRequest();
        const that: MapBuilder = this;
        mapRequest.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                const myObj: any = JSON.parse(this.responseText);
                let page: string = null;
                if (window.location.search.indexOf("?page=") === 0) {
                    page = window.location.search.substring(6);
                }
                that.initNodeOpenStatus(myObj.root, page);
                document.getElementById("content").innerHTML = that.buildNodeText(myObj.root, 0, page).getHtml();
            }
        };
        mapRequest.open("GET", "../content/map.json");
        mapRequest.send();
    }

    public handleNodeClick(index: number): boolean {
        if ($("#" + MapBuilder.spanDivName + index).is(":visible")) {
            MapBuilder.hideNode(index);
        } else {
            MapBuilder.showNode(index);
        }
        return(false);
    }

    private static hideNode(index: number) {
        $("#" + MapBuilder.spanDivName + index).hide();
        document.getElementById(MapBuilder.toggleDivName + index).innerHTML = MapBuilder.closedNodeSymbol;
    }

    private static showNode(index: number) {
        $("#" + MapBuilder.spanDivName + index).show();
        document.getElementById(MapBuilder.toggleDivName + index).innerHTML = MapBuilder.openedNodeSymbol;
    }

    private initNodeOpenStatus(node: MapNode, page: string): boolean {
        let oneChildIsOpen: boolean = false;
        if (node.children !== undefined) {
            for (let child of node.children) {
                oneChildIsOpen = oneChildIsOpen || this.initNodeOpenStatus(child, page);
            }
        }
        if (node.page === page) {
            node.open = true;
        } else {
            node.open = oneChildIsOpen;
        }
        return node.open;
    }

    private buildNodeText(node: MapNode, depth: number, page: string): HtmlString {
        const str: HtmlString = HtmlString.buildEmpty();
        for (let i = 0; i < depth; i++) {
            str.appendString("\u00A0\u00A0\u00A0\u00A0");
        }
        if (node.page === undefined) {
            str.appendString(node.title);
        } else {
            str.appendTag("a", node.title,
                          "href", "../" + node.page,
                          "title", "language: " + node.languages.join() + " | format: " + node.formats.join(),
                          "target", "_self",
                          "style", (node.page === page ? "font-weight: bold" : ""));
        }
        if (node.children === undefined) {
            str.appendEmptyTag("br");
        } else {
            const counter = this.divCounter;
            this.divCounter++;
            str.appendTag("a", node.open ? MapBuilder.openedNodeSymbol : MapBuilder.closedNodeSymbol,
                          "onclick", "window.handleMapNodeClick(" + counter + ")",
                          "id", MapBuilder.toggleDivName + counter,
                          "style", "cursor: pointer");
            str.appendEmptyTag("br");
            const childStr: HtmlString = HtmlString.buildEmpty();
            for (let child of node.children) {
                childStr.appendString(this.buildNodeText(child, depth + 1, page));
            }
            str.appendTag("span", childStr,
                          "id", MapBuilder.spanDivName + counter,
                          "style", "display: " + (node.open ? "initial" : "none"));
        }
        return str;
    }
}

(<any>window).handleMapNodeClick = (index: number) => {
    MapBuilder.prototype.handleNodeClick(index);
};
