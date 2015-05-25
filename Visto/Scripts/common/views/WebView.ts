import visto = require("libs/visto");
import common = require("../main");

export class WebView extends visto.ViewBase {
    url: KnockoutObservable<string>;
    initialHtml: string;
    currentBaseUrl: string;

    onLoading() {
        this.url = this.parameters.getObservableString("url", "");
        this.subscribe(this.url,(newUrl) => this.navigateToUrl(newUrl));
        this.registerSubmitEvent();

        return Q($.ajax({
            type: "GET",
            url: this.url()
        })).then((data: string) => {
            this.initialHtml = data;
        }).catch(() => {
            this.initialHtml = "[URL: Not found]";
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
        Q($.ajax(settings)).then((data: string) => {
            this.setHtml(data, this.getBaseUrl(settings.url));
            visto.hideLoading();
        }).catch((exception: any) => {
            visto.hideLoading();
            common.alert("HTTP Request failed", "HTTP Error " + exception.status + ": " + exception.statusText);
        });
    }

    private setHtml(data: string, baseUrl: string) {
        this.currentBaseUrl = baseUrl;
        this.element.html(data);
        this.registerLinkEvents();
    }
}