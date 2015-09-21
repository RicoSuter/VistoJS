import visto = require("libs/visto");

export class ButtonModel extends visto.ViewModel {
    enabled: KnockoutObservable<boolean>;
    content = ko.observable("");

    initialize() {
        this.enabled = this.parameters.getObservableBoolean("enabled", true);
        this.content(this.parameters.tagContentHtml);
    }
}