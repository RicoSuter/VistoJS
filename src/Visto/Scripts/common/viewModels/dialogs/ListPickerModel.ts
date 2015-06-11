import visto = require("libs/visto");

export class ListPickerModel extends visto.ViewModel {
	items: KnockoutObservableArray<any>;
	selectedItem: KnockoutObservable<any>;

	enable: KnockoutObservable<boolean>;
	label: KnockoutObservable<string>;

	optionsValue: string; 
	optionsText: string; 
	
    initialize(parameters: visto.Parameters) {
        // TODO: Reimplement whole control

		this.items = parameters.getObservableArray<any>("items");
		this.selectedItem = parameters.getObservableObject<any>("selectedItem");

		this.enable = parameters.getObservableBoolean("enable", true);
        this.label = parameters.getObservableString("label");

        this.optionsText = parameters.getString("optionsText", "title");
	}
}