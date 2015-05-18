import visto = require("libs/visto");
import common = require("common/main");

export class SampleControlModel extends visto.ViewModel {
    selectedText: KnockoutObservable<string>;
    transformedText: KnockoutComputed<string>;

	initialize() {
        this.selectedText = this.parameters.getObservable("selectedText", "n/a");
        this.transformedText = ko.computed<string>(() => this.selectedText().toUpperCase());
	}

    changeText() {
        common.prompt("Change text", "Please change the text: ", this.selectedText(), (newText) => {
            if (newText != null)
                this.selectedText(newText);
		});
    }
}