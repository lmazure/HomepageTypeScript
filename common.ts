import { HtmlString } from "./HtmlString.js";
import { Author, Link, Article, MapNode, Keyword, DataLoader } from "./DataLoader.js";
import { ContentBuilder } from "./ContentBuilder.js";
import { Popup } from "./Popup.js";

// ---------------------------------------------------------------------------------------------------------------

function escapeHtml(unsafe: string): string {
    return unsafe.replace(/&/g, "&amp;")
                 .replace(/</g, "&lt;")
                 .replace(/>/g, "&gt;")
                 .replace(/"/g, "&quot;")
                 .replace(/'/g, "&#039;");
 }

 // ---------------------------------------------------------------------------------------------------------------

 (<any>window).create_index = () => {
    let letters: string = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let w: number = 100.0 / letters.length;
    let str: string = '<table id="navigationBar" width="100%"><TR>';
    for (let i: number = 0; i < letters.length; i++ ) {
        str += '<td align="center" width="'
               + w
               + '%"><a href="#'
               + letters.charAt(i)
               + '">'
               + letters.charAt(i)
               + "</a></td>";
    }
  str += "<tr></table>";
  document.body.insertAdjacentHTML( "afterbegin", str);
};

// ---------------------------------------------------------------------------------------------------------------

(<any>window).do_email = () => {
    window.location.href = "mailto:"
                           + "lmazure.website%40gmail.com"
                           + "?subject="
                           + encodeURIComponent("about the '"
                               + document.title
                               + "' page");
};

// ---------------------------------------------------------------------------------------------------------------

(<any>window).display_search = () => {
    const searchPanel: HTMLElement = document.getElementById("searchPanel");
    if (isHidden(searchPanel)) {
        searchPanel.style.display = "block";
        scrollTo(0, document.body.scrollHeight);
        const searchText: HTMLElement = document.getElementById("searchText");
        searchText.focus();
    } else {
        searchPanel.style.display = "none";
    }
};

// ---------------------------------------------------------------------------------------------------------------

(<any>window).do_search = () => {
  let request: string = "https://duckduckgo.com/?q=site%3Amazure.fr+";
  const terms: string[] = (<HTMLTextAreaElement>document.getElementById("searchText")).value.split(" ");
  for (let i: number = 0; i < terms.length; i++) {
    if (terms[i] !== "") { // to avoid additional space characters
      if (i > 0) {
          request += "+";
      }
      request += terms[i];
    }
  }
  open(request, "_blank");
};

// ---------------------------------------------------------------------------------------------------------------

declare function postInitialize(): void;

(<any>window).onload = () => {
  if (typeof postInitialize === "function") {
    postInitialize();
  }
};

// ---------------------------------------------------------------------------------------------------------------

let popup: Popup = null;
let personPopupAuthors: Author[] = null;

(<any>window).do_person = (event: MouseEvent,
                           author: Author) => {

    event.stopPropagation();

    if (personPopupAuthors == null) {
        const loader: DataLoader = new DataLoader( (authors, articles, links, referringPages, keywords) => {
            personPopupAuthors = authors;
            (<any>window).do2_person(event, author);
        });
    } else {
        (<any>window).do2_person(event, author);
    }
};

(<any>window).do2_person = (event: MouseEvent,
                            author: Author) => {

    if (popup === null) {
        popup = new Popup();
    }

    const description: HtmlString = HtmlString.buildFromTag("h1", ContentBuilder.authorToHtmlString(author));

    let links: HtmlString = HtmlString.buildEmpty();
    let articles: HtmlString = HtmlString.buildEmpty();
    for (let a of personPopupAuthors) {
        if ((a.namePrefix === author.namePrefix) &&
            (a.firstName === author.firstName) &&
            (a.middleName === author.middleName) &&
            (a.lastName === author.lastName) &&
            (a.nameSuffix === author.nameSuffix) &&
            (a.givenName === author.givenName)) {
            if (a.links !== undefined) {
                for (let link of a.links) {
                    links.appendTag("li", ContentBuilder.linkToHtmlString(link));
                }
            }
            for (let art of a.articles) {
                articles.appendTag("li", ContentBuilder.linkToHtmlString(art.links[0]));
            }
        }
    }
    if (!links.isEmpty()) {
        description.appendTag("h2", "Links");
        description.appendTag("ul", links);
    }
    if (!articles.isEmpty()) {
        description.appendTag("h2", "Articles");
        description.appendTag("ul", articles);
    }

    popup.display(event, description);
};

// ---------------------------------------------------------------------------------------------------------------

let keywordPopupKeywords: Keyword[] = null;

(<any>window).do_keyword = (event: MouseEvent,
                            keyId: string) => {

    event.stopPropagation();

    if (personPopupAuthors == null) {
        const loader: DataLoader = new DataLoader( (authors, articles, links, referringPages, keywords) => {
            keywordPopupKeywords = keywords;
            (<any>window).do2_keyword(event, keyId);
        });
    } else {
        (<any>window).do2_keyword(event, keyId);
    }
};

(<any>window).do2_keyword = (event: MouseEvent,
                             keyId: string) => {

    if (popup === null) {
        popup = new Popup();
    }

    const description: HtmlString = HtmlString.buildFromTag("h1", keyId);

    let links: HtmlString = HtmlString.buildEmpty();
    let articles: HtmlString = HtmlString.buildEmpty();
    for (let k of keywordPopupKeywords) {
        if (k.id === keyId) {
            if (k.links !== undefined) {
                for (let link of k.links) {
                    links.appendTag("li", ContentBuilder.linkToHtmlString(link));
                }
            }
            for (let art of k.articles) {
                articles.appendTag("li", ContentBuilder.linkToHtmlString(art.links[0]));
            }
        }
    }
    if (!links.isEmpty()) {
        description.appendTag("h2", "Links");
        description.appendTag("ul", links);
    }
    if (!articles.isEmpty()) {
        description.appendTag("h2", "Articles");
        description.appendTag("ul", articles);
    }

    popup.display(event, description);
 };

// ---------------------------------------------------------------------------------------------------------------

function isHidden(element: HTMLElement): boolean {
    const style: CSSStyleDeclaration = window.getComputedStyle(element);
    return (style.display === "none");
}
