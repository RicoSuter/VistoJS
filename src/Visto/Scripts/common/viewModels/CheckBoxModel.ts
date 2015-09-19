import visto = require("libs/visto");

export class CheckBoxModel extends visto.ViewModel {
    label: KnockoutObservable<string>;
    checked: KnockoutObservable<boolean>;

    initialize(parameters: visto.Parameters) {
        this.label = this.parameters.getObservableString("label", "");
        this.checked = this.parameters.getObservableBoolean("checked", false);
    }
}