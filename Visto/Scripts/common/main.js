define(["require", "exports", "libs/visto", "module"], function (require, exports, visto, package) {
    /**
     * Shows a confirm dialog box with with various buttons.
     */
    function confirm(title, message, buttons, completed) {
        var buttonCollection = [];
        if (buttons === 0 /* YesNoCancel */ || buttons === 1 /* YesNo */) {
            buttonCollection.push({
                label: "Yes",
                click: function (dialog) {
                    dialog.close();
                    completed("yes");
                }
            });
        }
        if (buttons === 0 /* YesNoCancel */ || buttons === 1 /* YesNo */) {
            buttonCollection.push({
                label: "No",
                click: function (dialog) {
                    dialog.close();
                    completed("no");
                }
            });
        }
        if (buttons === 2 /* OkCancel */ || buttons === 3 /* Ok */) {
            buttonCollection.push({
                label: "OK",
                click: function (dialog) {
                    dialog.close();
                    completed("ok");
                }
            });
        }
        if (buttons === 0 /* YesNoCancel */ || buttons === 2 /* OkCancel */) {
            buttonCollection.push({
                label: "Cancel",
                click: function (dialog) {
                    dialog.close();
                    completed("cancel");
                }
            });
        }
        visto.dialog(visto.getViewName(package, "dialogs/Confirm"), {
            title: title,
            message: message,
            buttons: buttonCollection
        }, null, function (view) {
            view.dialog.on('keydown', function (ev) {
                if (ev.keyCode === $.ui.keyCode.ESCAPE) {
                    view.dialog.dialog("close");
                    completed("cancel");
                }
            });
        });
    }
    exports.confirm = confirm;
    ;
    (function (ConfirmButtons) {
        ConfirmButtons[ConfirmButtons["YesNoCancel"] = 0] = "YesNoCancel";
        ConfirmButtons[ConfirmButtons["YesNo"] = 1] = "YesNo";
        ConfirmButtons[ConfirmButtons["OkCancel"] = 2] = "OkCancel";
        ConfirmButtons[ConfirmButtons["Ok"] = 3] = "Ok";
    })(exports.ConfirmButtons || (exports.ConfirmButtons = {}));
    var ConfirmButtons = exports.ConfirmButtons;
    /**
     * Shows a progress bar in a dialog. The dialog can be controlled using the dialog instance in the completed callback.
     */
    function progressDialog(title, completed) {
        visto.dialog(package, "dialogs/ProgressDialog", {
            title: title,
            resizable: false,
            draggable: true,
            dialogClass: "box no-close",
            modal: true,
            closeOnEscape: false
        }, null, function (view) {
            var progress = {
                maximum: null,
                value: 0,
                setMaximum: function (maximum) {
                    progress.maximum = maximum;
                    progress.update();
                },
                setValue: function (value) {
                    progress.value = value;
                    progress.update();
                },
                close: function () {
                    view.dialog.dialog("close");
                },
                update: function () {
                    if (progress.maximum === null)
                        view.getElement("#body").html("...");
                    else
                        view.getElement("#body").html(progress.value + " / " + progress.maximum);
                }
            };
            completed(progress);
        });
    }
    exports.progressDialog = progressDialog;
    ;
    ;
    /**
     * Shows an alert dialog box.
     */
    function alert(title, message, completed) {
        if (!$.isFunction(completed))
            completed = function () {
            };
        confirm(title, message, 3 /* Ok */, completed);
    }
    exports.alert = alert;
    ;
    /**
     * Shows an prompt dialog box to enter a string value.
     */
    function prompt(title, message, defaultText, completed) {
        var output = ko.observable(defaultText);
        visto.dialog(package, "dialogs/Prompt", {
            message: message,
            output: output,
            completed: completed,
            title: title,
            buttons: [
                {
                    label: "OK",
                    click: function (dialog) {
                        dialog.close();
                        completed(output());
                    }
                },
                {
                    label: "Cancel",
                    click: function (dialog) {
                        dialog.close();
                        completed(null);
                    }
                }
            ]
        }, null, function (view) {
            view.dialog.on('keyup', function (ev) {
                if (ev.keyCode === $.ui.keyCode.ESCAPE) {
                    view.dialog.dialog("close");
                    completed(null);
                }
                else if (ev.keyCode === $.ui.keyCode.ENTER) {
                    view.dialog.dialog("close");
                    completed(output());
                }
            });
        });
    }
    exports.prompt = prompt;
    ;
    /**
     * Shows a dialog with a list picker.
     */
    function listPicker(header, label, items, selectedItem, optionsText, completed) {
        if ($.isFunction(selectedItem))
            selectedItem = selectedItem();
        selectedItem = ko.observable(selectedItem);
        visto.dialog(package, "dialogs/ListPicker", {
            title: header,
            label: label,
            selectedItem: selectedItem,
            items: items,
            optionsText: optionsText,
            buttons: [
                {
                    label: "OK",
                    click: function (dialog) {
                        dialog.close();
                        completed(selectedItem());
                    }
                },
                {
                    label: "Cancel",
                    click: function (dialog) {
                        dialog.close();
                        completed(null);
                    }
                }
            ]
        }, null, function (view) {
            view.dialog.on('keyup', function (ev) {
                if (ev.keyCode === $.ui.keyCode.ESCAPE) {
                    view.dialog.dialog("close");
                    completed(null);
                }
                else if (ev.keyCode === $.ui.keyCode.ENTER) {
                    view.dialog.dialog("close");
                    completed(selectedItem());
                }
            });
        });
    }
    exports.listPicker = listPicker;
    ;
});
//# sourceMappingURL=main.js.map