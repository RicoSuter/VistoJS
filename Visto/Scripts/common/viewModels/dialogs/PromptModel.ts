import visto = require("libs/visto");

export class PromptModel extends visto.ViewModel { 
    title: string;
    message: string;
    output: KnockoutObservable<string>;

    onOkClicked: () => void; 
    onCancelClicked: () => void; 

	initialize(parameters: visto.Parameters) {
        this.title = parameters.getString("title");
        this.message = parameters.getString("message");
        this.output = parameters.getObservableString("output", "");
    }
}