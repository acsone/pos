/*
    POS Payment Terminal module for Odoo
    Copyright (C) 2014-2016 Aurélien DUMAINE
    Copyright (C) 2014-2016 Akretion (www.akretion.com)
    Copyright (C) 2019 ACSONE SA/NV
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
        },
        show_validate_button: function(){
            var show = true;
            var self = this;

            if (self.pos.config.protect_automatic_payment){
                var payment_lines = self.get_paymentlines();
                for (var id in payment_lines){
                    var payment_line = payment_lines[id]
                    var payment_mode = payment_line.cashregister.journal.payment_mode
                    if (payment_mode && (!payment_line.terminal_transaction_id || (payment_line.terminal_transaction_id && !payment_line.terminal_transaction_success))) {
                        show = false;
                        break;
                    }
                }
            }
            return show;
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
        show_delete_button: function(){
            var show = true;
            var self = this;
            if (self.terminal_transaction_id){
                if(!self.terminal_transaction_success){
                    show = false;
                }
                if(self.terminal_transaction_success === false){
                    show = true;
                }
            }
            return show;
        },
        prepare_transaction_data: function(){
            var self = this;
            var order = self.pos.get_order();
            var data = {
                 'currency_iso' : self.pos.currency.name,
                 'currency_decimals' : self.pos.currency.decimals,
                 'order_id': order.uid,
                 'amount': self.get_amount(),
                 'payment_mode': self.cashregister.journal.payment_mode,
            }
            return data;
        },
        is_payment_terminal_driven: function(){
            var self = this;
            return self.cashregister.journal.payment_mode && self.pos.config.iface_payment_terminal;
        },
        show_payment_spinner: function(){
            var show = false;
            var self = this;

            if (self.terminal_transaction_id){
                if(self.terminal_transaction_success === null){
                    show = true;
                }
            }
            return show;
        },
        show_transaction_start: function(){
            var self = this;
            var show = self.is_payment_terminal_driven();
            if (self.terminal_transaction_id){
                if(self.terminal_transaction_success === null || self.terminal_transaction_success === true){
                    show = false;
                }
            }
            return show;

        },
        show_payment_status: function(){
            var show = false;
            var self = this;

            if(self.terminal_transaction_success !== undefined && self.terminal_transaction_status){
                show = true;
            }
            return show;
        }
    });
});
