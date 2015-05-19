import visto = require("libs/visto");

export class ConfirmModel extends visto.ViewModel {
	message: string;

    initialize(parameters: visto.Parameters) {
        this.message = parameters.getString("message");
	}
}