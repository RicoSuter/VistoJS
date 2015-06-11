import visto = require("libs/visto");
import main = require("../../main");

export class ConfirmModel extends visto.ViewModel {
    title: string;
	message: string;
    buttons: main.IDialogButton[];

    initialize(parameters: visto.Parameters) {
        this.title = parameters.getString("title");
        this.message = parameters.getString("message");
        this.buttons = parameters.getObject<main.IDialogButton[]>("buttons");
	}
}