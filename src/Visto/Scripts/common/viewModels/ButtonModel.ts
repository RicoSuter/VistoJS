import visto = require("libs/visto");

export class ButtonModel extends visto.ViewModel {
    enabled: KnockoutObservable<boolean>;
    content = ko.observable("");
    click: any;

    initialize() {
        this.enabled = this.parameters.getObservableBoolean("enabled", true);
        this.content(this.parameters.tagContentHtml);
        this.click = this.parameters.getFunction("click", this);
    }
}