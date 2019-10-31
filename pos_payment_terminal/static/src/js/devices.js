/*
    POS Payment Terminal module for Odoo
    Copyright (C) 2014-2016 Aurélien DUMAINE
    Copyright (C) 2014-2016 Akretion (www.akretion.com)
    @author: Aurélien DUMAINE
    @author: Alexis de Lattre <alexis.delattre@akretion.com>
    License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).
*/

odoo.define('pos_payment_terminal.devices', function (require) {
    "use strict";
    var models = require('point_of_sale.models');
    var devices = require('point_of_sale.devices');
    models.load_fields('account.journal', ['payment_mode']);

    devices.ProxyDevice.include({
        init: function(parents, options) {
            var self = this;
            self._super(parents, options);
            // We bind the status change
            self.on('change:status', self, self.on_change_status);
        },
        on_change_status: function(eh, status){
            var self = this;
            if(!self.pos.chrome.screens) {
                    return;
                }
            var paymentwidget = self.pos.chrome.screens.payment;
            var drivers = status.newValue.drivers;
            var order = self.pos.get_order();
            var in_transaction = false;

            // Check if the driver result is a terminal and then
            // update payment lines with result
            Object.keys(drivers).forEach(function(driver_name) {
                if (drivers[driver_name].hasOwnProperty("is_terminal")) {
                    self.update_payment_line(drivers[driver_name])
                }
            });
            order.in_transaction = in_transaction;
            paymentwidget.order_changes();
        },
        update_payment_line: function(response){
            var self = this;
            var order = self.pos.get_order();
            var paymentwidget = self.pos.chrome.screens.payment;
            if ('transactions' in response){
                for (var transaction_id in response.transactions){
                    var transaction = response.transactions[transaction_id];
                    if ('transaction_id' in transaction){
                        var transaction_id = transaction['transaction_id'];
                        var line = order.get_payment_line_by_transaction(transaction_id);
                        if (line === undefined){
                            continue;
                        }
                        if ('success' in transaction){
                            line.terminal_transaction_success = transaction['success'];
                        }
                        if ('status' in transaction){
                            line.terminal_transaction_status = transaction['status'];
                        }
                        if ('reference' in transaction){
                            line.terminal_transaction_reference = transaction['reference'];
                        }
                        if (line){
                            paymentwidget.transaction_changed(line);
                        }
                    }
                }
            }
        },
        update_transaction_data: function(line, data){
            data.amount = line.get_amount();
            data.payment_mode = line.cashregister.journal.payment_mode;
        },
        handle_terminal_response: function(line_id, response){
            // This is intended to entrich payment line with
            // useful values (status, transaction_id, ...)
            // Note that transaction_id is mandatory to match response
            if (response === undefined){
                return;
            }
            var self = this;
            var order = self.pos.get_order()
            var line = order.get_paymentline(line_id)
            var paymentwidget = self.pos.chrome.screens.payment;
            if ('transaction_id' in response){
                line.terminal_transaction_id = response['transaction_id']
            }
            if ('success' in response){
                line.terminal_success = response['success']
            }
            if ('status' in response){
                line.terminal_status = response['status']
            }
            if ('reference' in response){
                line.terminal_reference = response['reference']
            }
            paymentwidget.transaction_changed(line);
        },
        payment_terminal_transaction_start: function(line_cid, currency_iso, currency_decimals){
            var self = this;
            var line;
            var order = this.pos.get_order();
            var lines = order.get_paymentlines();
            for ( var i = 0; i < lines.length; i++ ) {
                if (lines[i].cid === line_cid) {
                    line = lines[i];
                }
            }
            var data = {
                 'currency_iso' : currency_iso,
                 'currency_decimals' : currency_decimals,
                 'order_id': order.uid,
            }
            self.update_transaction_data(line, data)
            self.message('payment_terminal_transaction_start', {'payment_info' : JSON.stringify(data)}).then(function(result){
                self.handle_terminal_response(line.cid, result);
            });
        },
    });
});
