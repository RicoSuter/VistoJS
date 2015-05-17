import visto = require("libs/visto");
import common = require("../main");

export class WebView extends visto.VistoViewBase {
    url: KnockoutObservable<string>;
    initialHtml: string;
    currentBaseUrl: string;

    onLoading(completed: () => void) {
        this.url = this.parameters.getObservable("url", "");
        this.subscribe(this.url,(newUrl) => this.navigateToUrl(newUrl));
        this.registerSubmitEvent();

        $.ajax({
            type: "GET",
            url: this.url()
        }).done((data: string) => {
            this.initialHtml = data;
            completed();
        }).fail(() => {
            this.initialHtml = "[URL: Not found]";
            completed();
        });
    }

    onLoaded() {
        this.setHtml(this.initialHtml, this.getBaseUrl(this.url()));
    }

    private getBaseUrl(url: string) {
        url = url.replace("//", "||");
        if (url.lastIndexOf("/") === -1)
            return url.replace("||", "//");
        else 
            return url.substring(0, url.lastIndexOf("/")).replace("||", "//");
    }

    private navigateToUrl(url: string) {
        this.loadHtml({
            type: "GET",
            url: url
        });
    }

    private registerSubmitEvent() {
        this.element.submit(e => {
            e.preventDefault();
            var form = $(e.target);
            this.loadHtml({
                type: form.attr("method"),
                url: form.attr("action"),
                data: form.serialize()
            });
        });
    }

    private registerLinkEvents() {
        this.element.find("a").click(args => {
            var url = $(args.target).attr("href");
            this.navigateToUrl(url);
            return false;
        });
    }

    private loadHtml(settings: JQueryAjaxSettings) {
        if (settings.url.indexOf("://") === -1)
            settings.url = this.currentBaseUrl + "/" + settings.url;

        visto.showLoading();
        $.ajax(settings).done((data: string) => {
            this.setHtml(data, this.getBaseUrl(settings.url));
            visto.hideLoading();
        }).fail((result: any, textStatus: string) => {
            visto.hideLoading();
            common.alert(
                "HTTP request failed",
                textStatus + ": " + result.statusText);
        });
    }

    private setHtml(data: string, baseUrl: string) {
        this.currentBaseUrl = baseUrl;
        this.element.html(data);
        this.registerLinkEvents();
    }
}