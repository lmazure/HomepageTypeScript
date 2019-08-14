/// <reference path ="lib/jquery.d.ts"/>
/// <reference path ="lib/google.analytics.d.ts"/>

import HtmlString from "./HtmlString.js";
import { Author, Link, Article, MapNode, DataLoader } from "./DataLoader.js";
import ContentBuilder from "./ContentBuilder.js";

// ---------------------------------------------------------------------------------------------------------------

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
    } else {
        searchPanel.style.display = "none";
    }
};

// ---------------------------------------------------------------------------------------------------------------

(<any>window).do_search = () => {
  let request: string = "http://www.google.com/search?as_sitesearch=mazure.fr&q=";
  const terms: string[] = (<string>($("#searchPanel>#panel>#text").val())).split(" ");
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

// rfc/<rfc-number>
// man/linux/<man-section-number>/<command>
// man/macosx/<man-section-number>/<command>
// man/x11/<man-section-number>/<command>
// j2se/<class>
// j2se/<class>/<method>
// clearcase/command

(<any>window).do_reference = (str: string) => {
    const a: string[] = str.split("/");
    let url: string = "?";
    if ( a[0] === "rfc" ) {
        url = "http://www.ietf.org/rfc/rfc" + a[1] + ".txt";
    } else if ( a[0] === "man" && a[1] === "linux" ) {
        url = "http://man7.org/linux/man-pages/man" + a[2].substr(0, 1) + "/" + a[3] + "." + a[2] + ".html";
    } else if ( a[0] === "man" && a[1] === "macosx" ) {
        url = "https://developer.apple.com/legacy/library/documentation/Darwin/Reference/ManPages/man"
          + a[2]
          + "/"
          + a[3]
          + "."
          + a[2]
          + ".html";
    } else if ( a[0] === "man" && a[1] === "x11" ) {
        url = "http://www.x.org/X11R6.8.2/doc/" + a[3] + "." + a[2] + ".html";
    } else if ( a[0] === "j2se" && a.length === 2 ) {
        url = "http://java.sun.com/j2se/1.5.0/docs/api/" + a[1].replace(/\./g, "/") + ".html";
    } else if ( a[0] === "j2se" && a.length === 3 ) {
        url = "http://java.sun.com/j2se/1.5.0/docs/api/" + a[1].replace(/\./g, "/") + ".html#" + escapeHtml(a[2]);
    } else if ( a[0] === "clearcase" && a.length === 2 ) {
        url = "http://www.agsrhichome.bnl.gov/Controls/doc/ClearCaseEnv/v4.0doc/cpf_4.0/ccase_ux/ccref/"
        + a[1]
        + ".html";
    }
    window.open(url, "_blank");
};

// ---------------------------------------------------------------------------------------------------------------

declare function postInitialize(): void;

(<any>window).onload = () => {
    const currdate: any = new Date();

    /* tslint:disable:no-string-literal */
    /* tslint:disable:semicolon */
    /* tslint:disable:no-unused-expression */
    // This code is from Google, so let's not modify it too much
    (function(i, s, o, g, r, a, m) {
        i["GoogleAnalyticsObject"] = r;
        i[r] = i[r] || function() {
            (i[r].q = i[r].q || []).push(arguments)
        }, i[r].l = 1 * currdate;
        a = s.createElement(o), m = s.getElementsByTagName(o)[0];
        a.async = 1;
        a.src = g;
        m.parentNode.insertBefore(a, m)
        })(window, document, "script", "//www.google-analytics.com/analytics.js", "ga");
    /* tslint:enable:no-unused-expression */
    /* tslint:enable:semicolon */
    /* tslint:enable:no-string-literal */

  ga("create", "UA-45789787-1", "auto");
  ga("send", "pageview");

  if (typeof postInitialize === "function") {
    postInitialize();
  }
};

// ---------------------------------------------------------------------------------------------------------------

let personPopup: HTMLElement = null;
let personPopupAuthors: Author[] = null;

(<any>window).do_person = (event: MouseEvent,
                           author: Author) => {

    event.stopPropagation();

    if (personPopupAuthors == null) {
        const loader: DataLoader = new DataLoader( (authors, articles, links, referringPages) => {
            personPopupAuthors = authors;
            // this.articles = articles;
            // this.links = links;
            // this.referringPages = referringPages;
            (<any>window).do2_person(event, author);
        });
    } else {
        (<any>window).do2_person(event, author);
    }
};

(<any>window).do2_person = (event: MouseEvent,
                            author: Author) => {

    if (personPopup === null) {
        personPopup = document.createElement("div");
        personPopup.style.width = "40%";
        personPopup.style.height = "40%";
        personPopup.onclick = function(e: MouseEvent) { e.stopPropagation(); };
        personPopup.classList.add("personPopup");
        document.getElementById("footer").insertAdjacentElement("afterend", personPopup);
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
    description.appendTag("h2", "Articles");
    description.appendTag("ul", articles);

    const clickHandler = function(e: MouseEvent) {
        window.removeEventListener("click", clickHandler);
        personPopup.style.visibility = "hidden";
    };
    window.addEventListener("click", clickHandler);

    personPopup.innerHTML = description.getHtml();
    if ((event.clientY + personPopup.offsetHeight) < document.documentElement.clientHeight ) {
        personPopup.style.top = event.pageY + "px";
    } else {
        personPopup.style.top = (event.pageY - personPopup.offsetHeight) + "px";
    }
    if ((event.clientX + personPopup.offsetWidth) < document.documentElement.clientWidth ) {
        personPopup.style.left = event.pageX + "px";
    } else {
        personPopup.style.left = (event.pageX - personPopup.offsetWidth) + "px";
    }
    personPopup.scrollTop = 0;
    personPopup.style.visibility = "visible";
};

// ---------------------------------------------------------------------------------------------------------------

function isHidden(element: HTMLElement): boolean {
    const style: CSSStyleDeclaration = window.getComputedStyle(element);
    return (style.display === "none");
}
