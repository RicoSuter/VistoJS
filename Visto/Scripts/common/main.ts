import visto = require("libs/visto");
import package = require("module");

/**
 * Shows a confirm dialog box with with various buttons.
 */
export function confirm(title: string, message: string, buttons: ConfirmButtons, completed: (result: string) => void) {
    var buttonCollection: any = {};
    if (buttons === ConfirmButtons.YesNoCancel || buttons === ConfirmButtons.YesNo) {
        buttonCollection["Ja"] = function () {
            var self = this;
            $(self).dialog("close");
            completed("yes");
        };
    }

    if (buttons === ConfirmButtons.YesNoCancel || buttons === ConfirmButtons.YesNo) {
        buttonCollection["Nein"] = function () {
            var self = this;
            $(self).dialog("close");
            completed("no");
        };
    }

    if (buttons === ConfirmButtons.OkCancel || buttons === ConfirmButtons.Ok) {
        buttonCollection["OK"] = function () {
            var self = this;
            $(self).dialog("close");
            completed("ok");
        };
    }

    if (buttons === ConfirmButtons.YesNoCancel || buttons === ConfirmButtons.OkCancel) {
        buttonCollection["Abbrechen"] = function () {
            var self = this;
            $(self).dialog("close");
            completed("cancel");
        };
    }

    visto.dialog(visto.getViewName(package, "dialogs/Confirm"), {
         message: message
    }, {
        title: title,
        resizable: false,
        draggable: true,
        dialogClass: "box no-close",
        modal: true,
        closeOnEscape: false,
        buttons: buttonCollection
    }, null, view => {
        view.dialog.on('keydown', ev => {
            if (ev.keyCode === $.ui.keyCode.ESCAPE) {
                view.dialog.dialog("close");
                completed("cancel");
            }
        });
    });
};

export enum ConfirmButtons {
    YesNoCancel, 
    YesNo, 
    OkCancel, 
    Ok
}

/**
 * Shows a progress bar in a dialog. The dialog can be controlled using the dialog instance in the completed callback. 
 */
export function progressDialog(title: string, completed: (dialog: IProgressDialog) => void) {
    visto.dialog(visto.getViewName(package, "dialogs/ProgressDialog"), {}, {
        title: title,
        resizable: false,
        draggable: true,
        dialogClass: "box no-close",
        modal: true,
        closeOnEscape: false
    }, null, view => {
        var progress: any = {
            maximum: null,
            value: 0,
            setMaximum: (maximum: number) => {
                progress.maximum = maximum;
                progress.update();
            },
            setValue: (value: number) => {
                progress.value = value;
                progress.update();
            },
            close: () => {
                view.dialog.dialog("close");
            },
            update: () => {
                if (progress.maximum === null)
                    view.getElement("#body").html("...");
                else
                    view.getElement("#body").html(progress.value + " / " + progress.maximum);
            }
        };
        completed(progress);
    });
};

export interface IProgressDialog {
    setMaximum(maximum: number): void;
    setValue(value: number): void;
    close(): void;

    maximum: number;
    value: number;
};

/**
 * Shows an alert dialog box. 
 */
export function alert(title: string, message: string, completed?: () => void) {
    if (!$.isFunction(completed))
        completed = () => { };
    confirm(title, message, ConfirmButtons.Ok, completed);
};

/**
 * Shows an prompt dialog box to enter a string value. 
 */
export function prompt(title: string, message: string, defaultText: string, completed: (result: string) => void) {
    var output = ko.observable(defaultText);
    visto.dialog(visto.getViewName(package, "dialogs/Prompt"), {
        message: message,
        output: output,
        completed: completed
    }, {
        title: title,
        resizable: false,
        draggable: true,
        dialogClass: "box no-close",
        modal: true,
        closeOnEscape: false,
        buttons: {
            "OK": function () {
                var self = this;
                $(self).dialog("close");
                completed(output());
            },
            "Abbrechen": function () {
                var self = this;
                $(self).dialog("close");
                completed(null);
            }
        }
    }, null, view => {
        view.dialog.on('keyup', ev => {
            if (ev.keyCode === $.ui.keyCode.ESCAPE) {
                view.dialog.dialog("close");
                completed(null);
            } else if (ev.keyCode === $.ui.keyCode.ENTER) {
                view.dialog.dialog("close");
                completed(output());
            }
        });
    });
};

/**
 * Shows a dialog with a list picker. 
 */
export function listPicker(header: string, label: string, items: any[], selectedItem: any, optionsText: string, completed: (result: any) => void) {
    if ($.isFunction(selectedItem))
        selectedItem = selectedItem();

    selectedItem = ko.observable(selectedItem);

    visto.dialog(visto.getViewName(package, "dialogs/ListPicker"), {
        label: label,
        selectedItem: selectedItem,
        items: items,
        optionsText: optionsText
    }, {
        title: header,
        resizable: false,
        draggable: true,
        dialogClass: "box no-close",
        modal: true,
        closeOnEscape: false,
        buttons: {
            "OK": function () {
                var self = this;
                $(self).dialog("close");
                completed(selectedItem());
            },
            "Abbrechen": function () {
                var self = this;
                $(self).dialog("close");
                completed(null);
            }
        }
    }, null, view => {
        view.dialog.on('keyup', ev => {
            if (ev.keyCode === $.ui.keyCode.ESCAPE) {
                view.dialog.dialog("close");
                completed(null);
            } else if (ev.keyCode === $.ui.keyCode.ENTER) {
                view.dialog.dialog("close");
                completed(selectedItem());
            }
        });
    });
};