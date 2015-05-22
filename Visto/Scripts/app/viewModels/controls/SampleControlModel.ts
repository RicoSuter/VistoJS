import visto = require("libs/visto");
import common = require("common/main");

export class SampleControlModel extends visto.ViewModel {
    selectedText: KnockoutObservable<string>;
    transformedText: KnockoutComputed<string>;

	initialize() {
        this.selectedText = this.parameters.getObservableString("selectedText", "n/a");
        this.transformedText = ko.computed<string>(() => this.selectedText().toUpperCase());
	}

    changeText() {
        common.prompt("Change text", "Please change the text: ", this.selectedText()).then((newText) => {
            this.selectedText(newText);
        });
    }
}