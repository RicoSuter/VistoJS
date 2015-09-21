import visto = require("libs/visto");
import validationControlModel = require("./ValidationControlModel");

export class CheckBoxModel extends validationControlModel.ValidationControlModel {
    label: KnockoutObservable<string>;
    checked: KnockoutObservable<boolean>;

    initialize(parameters: visto.Parameters) {
        this.label = this.parameters.getObservableString("label", "");
        this.checked = this.parameters.getObservableBoolean("checked", false);
    }
}