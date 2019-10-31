/*
    POS Payment Terminal module for Odoo
    Copyright (C) 2014-2016 Aurélien DUMAINE
    Copyright (C) 2014-2016 Akretion (www.akretion.com)
    @author: Aurélien DUMAINE
    @author: Alexis de Lattre <alexis.delattre@akretion.com>
    License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).
*/

odoo.define('pos_payment_terminal.models', function (require) {
    "use strict";

    var models = require('point_of_sale.models');

    var _orderproto = models.Order.prototype;
    models.Order = models.Order.extend({
        initialize: function(){
            _orderproto.initialize.apply(this, arguments);
            this.in_transaction = false;
        },
        export_as_JSON: function() {
            var vals = _orderproto.export_as_JSON.apply(this, arguments);
            vals['transactions'] = this.transactions || {};
            return vals;
        },
        get_paymentline: function(id){
            var paymentlines = this.paymentlines.models;
            for(var i = 0; i < paymentlines.length; i++){
                if(paymentlines[i].cid === id){
                    return paymentlines[i];
                }
            }
            return null;
        },
        get_payment_line_by_transaction: function(transaction_id){
            // This will retrieve the payment line by transaction reference
            self = this;
            var payment_lines = self.get_paymentlines();
            for (var id in payment_lines){
                var payment_line = payment_lines[id]
                if (payment_line.terminal_transaction_id === undefined){
                    continue;
                }
                if (transaction_id === payment_line.terminal_transaction_id){
                    return payment_line;
                }
            }
            return;
        }
    });
    var _paymentlineproto = models.Paymentline.prototype;
    models.Paymentline = models.Paymentline.extend({
        initialize: function(attr, options){
            this.terminal_transaction_id = false;
            this.terminal_transaction_success = false;
            this.terminal_transaction_status = false;
            this.terminal_transaction_reference = false;
            _paymentlineproto.initialize.apply(this, arguments);
        },
        init_from_JSON: function(json){
            _paymentlineproto.init_from_JSON.apply(this, arguments);
            this.terminal_transaction_id = json.terminal_transaction_id;
            this.terminal_transaction_success = json.terminal_transaction_success;
            this.terminal_transaction_status = json.terminal_transaction_status;
            this.terminal_transaction_reference = json.terminal_transaction_reference;
        },
        export_as_JSON: function() {
            var vals = _paymentlineproto.export_as_JSON.apply(this, arguments);
            vals['terminal_transaction_id'] = this.terminal_transaction_id || false;
            vals['terminal_transaction_success'] = this.terminal_transaction_success || false;
            vals['terminal_transaction_status'] = this.terminal_transaction_status || false;
            vals['terminal_transaction_reference'] = this.terminal_transaction_reference || false;
            return vals;
        },
        get_amount: function(){
            // If payment line is related to terminal transaction,
            // return the amount really paid
            var self = this;
            var amount = _paymentlineproto.get_amount.apply(this, arguments);
            if (self.terminal_transaction_id && !self.terminal_transaction_success){
                amount = 0
            }
            return amount;
        },
    });
});