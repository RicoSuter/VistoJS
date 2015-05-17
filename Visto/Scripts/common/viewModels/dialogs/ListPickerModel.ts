import visto = require("libs/visto");

export class ListPickerModel extends visto.VistoViewModel {
	items: KnockoutObservableArray<any>;
	selectedItem: KnockoutObservable<any>;

	enable: KnockoutObservable<boolean>;
	label: KnockoutObservable<string>;

	optionsValue: string; 
	optionsText: string; 
	
    initialize(parameters: visto.VistoParameters) {
		this.items = parameters.getObservableArray<any>("items");
		this.selectedItem = parameters.getObservable<any>("selectedItem");

		this.enable = parameters.getObservable<boolean>("enable", true);
		this.label = parameters.getObservable<string>("label");

		this.optionsText = parameters.getValue<string>("optionsText", "title");
	}
}