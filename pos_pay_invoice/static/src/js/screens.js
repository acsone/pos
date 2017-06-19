/*
    © 2017 Acsone SA/NV (http://www.acsone.eu)
    License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
*/


odoo.define('pos_pay_invoice.screens', function (require) {
    "use strict";

    var core = require('web.core');
    var gui = require('point_of_sale.gui');
    var formats = require('web.formats');

    var Model = require('web.Model');

    var Qweb = core.qweb;
    var _t = core._t;

    var PayInvoiceWidgets = require('pos_pay_invoice.widgets');
    var PosScreens = require('point_of_sale.screens');

    var ScreenWidget = PosScreens.ScreenWidget;
    var ProductScreenWidget = PosScreens.ProductScreenWidget;

    var PayInvoiceWidget = PayInvoiceWidgets.PayInvoiceWidget;

    ProductScreenWidget.include({

        start: function() {
            var self = this;
            self._super.apply(self, arguments);

            self.pay_invoice_widget = undefined;
            if(self.pos.config.iface_pay_invoice) {
                self.pay_invoice_widget = new PayInvoiceWidget(self, {});
                self.pay_invoice_widget.replace(self.$('.placeholder-PayInvoiceWidget'));
            }
        },

    });

    var InvoiceListScreenWidget = ScreenWidget.extend({
        template: 'InvoiceListScreenWidget',
        events: {
            'click .back': 'go_back',
            'keypress input.search-filter': 'filter_search',
            'keydown input.search-filter': 'filter_search',
            'change input.search-filter': 'filter_search',
            'click .search-clear': 'clear_search',
            'click .select-customer': 'select_customer',
        },

        init: function() {
            var self = this;
            self._super.apply(self, arguments);
            self.ModelInvoice = new Model('account.invoice');
            self.current_invoice = undefined;
            self.invoice_details_widget = undefined;
            self.invoices = [];
            self.search_timer = undefined;
            self.search_timeout = 500;
            self.search_limit = 500;
        },

        set_invoice: function(invoice) {
            var self = this;
            self.current_invoice = invoice;
        },

        get_customer: function() {
            var self = this;
            var currentOrder = self.pos.get_order();
            return currentOrder.get_client();
        },

        get_invoice_list_content_el: function() {
            var self = this;
            return self.$('tbody.invoice-list-contents');
        },

        get_invoice_details_el: function() {
            var self = this;
            return self.$('.invoice-details-contents');
        },

        get_search_filter_el: function() {
            var self = this;
            return self.$('input.search-filter');
        },

        get_search_value: function() {
            var self = this;
            return self.get_search_filter_el().val();
        },

        hide_invoice_details: function() {
            var self = this;
            self.get_invoice_details_el().empty();
        },

        go_back: function() {
            var self = this;
            self.gui.back();
        },

        filter_search: function() {
            var self = this;
            clearTimeout(self.search_timer);
            self.search_timer = setTimeout(function() {
                self.reload_invoices();
            }, self.search_timeout);
        },

        clear_search: function() {
            var self = this;
            var $search_filter = self.get_search_filter_el();
            $search_filter.val('');
            $search_filter.trigger('change');
        },

        has_customer: function() {
            var self = this;
            return !!self.get_customer();
        },

        show: function() {
            var self = this;
            self._super.apply(self, arguments);
            self.add_line_event();
            self.add_invoice_details_event();
            self.hide_invoice_details();
            self.reload_invoices();
        },

        add_line_event: function() {
            var self = this;
            var $invoice_list_content = self.get_invoice_list_content_el();
            $invoice_list_content.undelegate();
            $invoice_list_content.delegate('.invoice-line', 'click', function(event) {
                var $this = $(this);
                self.select_invoice_by_id(parseInt($this.data('id')));
            });
        },

        add_invoice_details_event: function() {
            var self = this;
            var $invoice_details = self.get_invoice_details_el();
            $invoice_details.undelegate();
            $invoice_details.delegate('div.pay', 'click', function(event) {
                if (!self.has_customer()) {
                    self.select_customer();
                }

                var invoice = self.current_invoice;
                var message = _t('POS Invoice Payment') + ' (' + invoice.number + ')';
                var order = self.pos.get_order();
                order.create_cash_deposit(invoice.amount_total, message);
                self.gui.show_popup('alert', {
                    'title': _t("Invoice added"),
                    'body': _t("Invoice with number")
                            + ' ' + invoice.number + ' '
                            + _("has been added to the order list."),
                })
            });

            $invoice_details.delegate('div.go-to', 'click', function(event) {
                self.open_current_invoice_in_backend();
            });
        },

        open_current_invoice_in_backend: function() {
            var self = this;
            var invoice_id = self.current_invoice.id;
            window.open(window.location.origin + '/web#id=' + invoice_id + '&view_type=form&model=account.invoice', '_blank');
        },

        get_invoice_by_id: function(invoice_id) {
            var self = this;
            return _.find(self.invoices, function(invoice) {
                return invoice.id === invoice_id;
            })
        },

        select_invoice_by_id: function(invoice_id) {
            var self = this;
            var invoice = self.get_invoice_by_id(invoice_id);

            if(!invoice) {
                self.hide_invoice_details();
                self.set_invoice(false);
                return;
            }

            var $line = self.get_invoice_list_content_el().find('tr[data-id=' + invoice_id + ']');

            if(self.current_invoice !== invoice) {
                self.set_invoice(invoice);
                self.display_current_invoice_details();
                self.toggle_select_customer_button();
                self.$('.invoice-list .highlight').removeClass('highlight');
                self.$('.invoice-list .lowlight').removeClass('lowlight');
                $line.addClass('highlight');
            } else {
                $line.removeClass('highlight');
                $line.addClass('lowlight');
            }
        },

        toggle_select_customer_button: function() {
            var self = this;
            if(self.has_customer()) {
                self.$('.select-customer').addClass('oe_hidden');
            } else {
                self.$('.select-customer').removeClass('oe_hidden');
            }
        },

        select_customer: function() {
            var self = this;

            if (!self.has_customer()) {
                var partner_id = self.current_invoice.partner_id[0];
                var partner = self.pos.db.get_partner_by_id(partner_id);
                self.pos.get_order().set_client(partner);
                self.toggle_select_customer_button();
                self.reload_invoices();
            }
        },

        display_current_invoice_details: function() {
            var self = this;
            var $invoice_details = self.get_invoice_details_el();
            self.hide_invoice_details();
            var invoice_details_html = Qweb.render('InvoiceDetails', {
                widget: self,
                invoice: self.current_invoice,
            });
            $invoice_details.append(invoice_details_html);
        },

        load_invoices: function() {
            var self = this;
            var fields = self.get_invoice_fields_to_read();
            var domain = self.get_invoice_domain();
            var def = self.ModelInvoice.
            query(fields).
            filter(domain).
            limit(self.search_limit).
            all().then(function(invoices) {
                _.each(invoices, function(invoice) {
                    self.format_invoice(invoice);
                });
                self.invoices = invoices;
            }).fail(function() {
                self.gui.show_popup('error', {
                    'title': _t("Unable to load invoice list"),
                    'body': _t("Please check your internet connection and retry."),
                });
            });
            return def
        },

        reload_invoices: function() {
            var self = this;
            self.load_invoices().then(function() {
                self.render_invoices();
            });
        },

        render_invoices: function() {
            var self = this;
            var $invoice_list = self.get_invoice_list_content_el();
            var invoice;
            var invoice_line_html;
            $invoice_list.empty();

            for(var i=0; i < self.invoices.length; i++) {
                invoice = self.invoices[i];
                invoice_line_html = Qweb.render('InvoiceLine', {
                    widget: self,
                    invoice: invoice,
                });
                $invoice_list.append(invoice_line_html);
            }

            if (!!self.current_invoice) {
                self.select_invoice_by_id(self.current_invoice.id);
            }
        },

        format_date: function(str_date) {
            return formats.format_value(str_date, {'type': 'date'});
        },

        format_monetary: function(str_float) {
            return formats.format_value(str_float, {'type': 'monetary'});
        },

        format_invoice: function(invoice) {
            var self = this;
            invoice.date_invoice = self.format_date(invoice.date_invoice);

            if (!!invoice.date_due) {
                invoice.date_due = self.format_date(invoice.date_due);
            }

            invoice.fmt_amount_total = self.format_monetary(invoice.amount_total);
            invoice.fmt_amount_untaxed = self.format_monetary(invoice.amount_untaxed);
            invoice.fmt_residual = self.format_monetary(invoice.residual);
        },

        get_invoice_fields_to_read: function() {
            return [
                'number', 'amount_tax', 'amount_untaxed', 'residual',
                'date_invoice', 'amount_total', 'origin',
                'date_due', 'state', 'partner_id',
            ]
        },

        get_invoice_domain: function() {
            var self = this;
            var client = self.get_customer();
            var search_filter = self.get_search_value();
            var domain = [
                ['state', '=', 'open'],
                ['type', '=', 'out_invoice'],
                ['currency_id', '=', self.pos.currency.id],
            ];
            if (!!client) {
                domain.push(['commercial_partner_id', '=', client.id]);
            }
            if (!_.isEmpty(search_filter)) {
                domain = domain.concat([
                    '|',
                        ['number', 'ilike', search_filter],
                        ['commercial_partner_id.name', 'ilike', search_filter],
                ]);
            }
            return domain;
        },

    });

    gui.define_screen({name:'invoicelist', widget: InvoiceListScreenWidget});

    return {
        InvoiceListScreenWidget: InvoiceListScreenWidget,
    }
});