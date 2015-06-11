import visto = require("libs/visto");

export class BindingsPageModel extends visto.ViewModel {
	selectedText: KnockoutObservable<string>;

    initialize() {
        this.selectedText = ko.observable("sample");
    }
};