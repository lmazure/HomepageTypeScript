import { HtmlString } from "./HtmlString.js";

export class Popup {

    private popup: HTMLElement;

    constructor() {
        this.popup = document.createElement("div");
        this.popup.style.width = "40%";
        this.popup.style.height = "40%";
        this.popup.onclick = function(e: MouseEvent) { e.stopPropagation(); };
        this.popup.classList.add("keywordPopup");
        document.getElementById("footer").insertAdjacentElement("afterend", this.popup);
    }

    public display(event: MouseEvent,
                   description: HtmlString): void {
        window.addEventListener("click", (e: MouseEvent) => this.clickHandler(e));
        window.addEventListener("keyup", (e: KeyboardEvent) => this.keyupHandler(e));

        this.popup.innerHTML = description.getHtml();
        if ((event.clientY + this.popup.offsetHeight) < document.documentElement.clientHeight ) {
            this.popup.style.top = event.pageY + "px";
        } else {
            this.popup.style.top = (event.pageY - this.popup.offsetHeight) + "px";
        }
        if ((event.clientX + this.popup.offsetWidth) < document.documentElement.clientWidth ) {
            this.popup.style.left = event.pageX + "px";
        } else {
            this.popup.style.left = (event.pageX - this.popup.offsetWidth) + "px";
        }
        this.popup.scrollTop = 0;
        this.popup.style.visibility = "visible";
    }

    private clickHandler(e: MouseEvent): void {
        this.undisplay();
    }

    private keyupHandler(e: KeyboardEvent): void {
        if (e.key === "Escape") {
            this.undisplay();
        }
    }

    private undisplay(): void {
        window.removeEventListener("click", this.clickHandler);
        window.removeEventListener("keyup", this.keyupHandler);
        this.popup.style.visibility = "hidden";
    }
}
