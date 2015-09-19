import validationView = require("./ValidationView");
import textBoxModel = require("../viewModels/TextBoxModel");
export declare class TextBox extends validationView.ValidationView<textBoxModel.TextBoxModel> {
    label: KnockoutObservable<string>;
    value: KnockoutObservable<string>;
    required: KnockoutObservable<boolean>;
    onLoaded(): void;
}
