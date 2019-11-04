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
            this.terminal_transaction_id = null;
            this.terminal_transaction_success = null;
            this.terminal_transaction_status = null;
            this.terminal_transaction_reference = null;
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
            vals['terminal_transaction_id'] = this.terminal_transaction_id;
            vals['terminal_transaction_success'] = this.terminal_transaction_success;
            vals['terminal_transaction_status'] = this.terminal_transaction_status;
            vals['terminal_transaction_reference'] = this.terminal_transaction_reference;
            return vals;
        },
    });
});