# -*- coding: utf-8 -*-

from odoo import fields, api, models
import base64
import requests
import psycopg2
from psycopg2.extras import execute_values

import logging
_logger = logging.getLogger(__name__)


class aspectPolicyKeywords(models.Model):
    _name = 'aspect.policy.keywords'
    _description="aspect.policy.keywords"

    name = fields.Char(string="Keyword")
    description = fields.Text(string="Description")
    language    = fields.Many2one('res.lang', string="Language", required=True)
    relation    =  fields.One2many('aspect.policy.keywords.relation', 'keyword', string='Relation')

    @api.model
    def create(self, vals):
        res = super(aspectPolicyKeywords, self).create(vals)
        if res.relation:
            for each_keyword in res.relation.keyword_relation:
                _logger.info({'name':res.language.id,'keyword':each_keyword,'keyword_relation':[(4,res.id)]})
                self.env['aspect.policy.keywords.relation'].create({'name':res.language.id,'keyword':each_keyword.id,'keyword_relation':[(4,res.id)]})
        return res

    # @api.model
    # def unlink(self, vals):
    #     self.env['aspect.policy.keywords.relation'].search([('','=','')])
    #
    #     res = super(aspectPolicyKeywords, self).unlink(vals)
    #     return res

class aspectPolicyKeywordsRelation(models.Model):
    _name = 'aspect.policy.keywords.relation'
    _description="keywords"


    name    = fields.Many2one('res.lang', string="Language", required=True)
    keyword = fields.Many2one('aspect.policy.keywords', string='Keyword')
    keyword_relation  = fields.Many2many('aspect.policy.keywords', string="Map Keyword")

class aspectNuts(models.Model):
    _name = 'aspect.nuts'
    _description="NUTS"

    name = fields.Char(string="Name", compute='_get_name')
    country = fields.Many2one('res.country', string="Country")
    country_code = fields.Char(string="Country Code")
    nuts_code = fields.Char(string="Code")
    nuts_label_eng = fields.Char(string="Label (English)")
    nuts_label = fields.Char(string="Label")
    nuts_level = fields.Selection([("1", "1"), ("2", "2"),("3", "3")], string="Level")
    polygon_file = fields.Binary('Shape File')
    country_map = fields.Boolean('For Country Map')
    state_map = fields.Boolean('For State Map')
    country_state = fields.Many2one('res.country.state', string="State", domain="[('country_id','=', country)]")
    geo_multipolygon = fields.GeoMultiPolygon(string="Shape Multi Poliygon")

    @api.onchange('country', 'nuts_level', 'state_map', 'country_map')
    def _get_name(self):
        for record in self:
            if record.state_map:
                record.name = str(record.country_state.name)
            elif record.country_map:
                record.name = str(record.country.name)
            else:
                record.name = str(record.country.name)+" - "+str(record.nuts_code)+ ' - Level:'+str(record.nuts_level)+ ' - Label:'+str(record.nuts_label)

    @api.model
    def _name_search(self, name='', args=None, operator='ilike', limit=100, name_get_uid=None):
        args = list(args or [])
        if name:
            args += ['|', '|', '|',('country', operator, name), ('nuts_code', operator, name), ('nuts_label_eng', operator, name), ('nuts_label', operator, name), ('country_state', operator, name)]
        return self._search(args, limit=limit, access_rights_uid=name_get_uid)

class resCountry(models.Model):
    _inherit = 'res.country'

    nuts = fields.One2many('aspect.nuts', 'country', string='Nuts', readonly=True)
    facts = fields.Text('Facts')

class aspectPolicyType(models.Model):
    _name = 'aspect.policy.type'

    name = fields.Char(string="Name")

class aspectPolicySiteType(models.Model):
    _name = 'aspect.policy.sitetype'

    name = fields.Char(string="Name")

    def write(self, vals):
        res = super().write(vals)
        policies = self.env['aspect.policies'].sudo().search([('state', '=', 'Published'),('is_uploaded', '!=', True),('id', 'in', (256,856,610,264,909,859))])
        for policy in policies:
            policy._upload_embeddings()
            policy.write({'is_uploaded': True})
        return res

class aspectPolicyCategory(models.Model):
    _name = 'aspect.policy.category'

    name = fields.Char(string="Name")
    color = fields.Integer('Color')

class aspectPolicyStakholder(models.Model):
    _name = 'aspect.policy.stakholder'
    _description="Stakholder"

    name = fields.Char(string="Name", required=True)
    country = fields.Many2one('res.country', string="Country", required=True)
    stakeholder_link = fields.Char(string="Stakeholder Link")
    stakeholder_level = fields.Selection([("Global", "Global"), ("National", "National"),("Regional", "Regional"),("Regional", "Regional"),("Local", "Local"),("European", "European")], string="Level")
    description = fields.Text(string="Description")
    color = fields.Integer('Color')

class aspectPolicyPublisher(models.Model):
    _name = 'aspect.policy.publisher'
    _description="Publisher"

    name = fields.Char(string="Name", required=True)
    country = fields.Many2one('res.country', string="Country", required=True)
    publisher_link = fields.Char(string="Publisher Link")
    description = fields.Text(string="Description")

class aspectPolicies(models.Model):
    _name = 'aspect.policies'
    _inherit = ["mail.thread"]
    _description="Policies"

    @api.model
    def year_selection(self):
        year = 1960
        year_list = []
        while year != 2060:
            year_list.append((str(year), str(year)))
            year += 1
        return year_list

    name = fields.Char(string="Name", required=True, tracking=True)
    name_language = fields.Char(string="Name (Native Language)", tracking=True)
    type = fields.Selection([("Policy", "Policy"), ("PeatMap", "PeatMap"),("Project", "Project")], string="Type", required=True, tracking=True)
    primary_category = fields.Many2one('aspect.policy.category', string="Primary Category", tracking=True)
    category = fields.Many2many('aspect.policy.category', string="Category")
    policy_level = fields.Selection([("Global", "Global"), ("National", "National"),("Regional", "Regional"),("Regional", "Regional"),("Local", "Local"),("European", "European")], string="Level", default='Global', tracking=True)
    language    = fields.Many2one('res.lang', string="Language", tracking=True)
    keywords  = fields.Many2many('aspect.policy.keywords', string="Keywords", domain="[('language','=', language)]", tracking=True)
    country_group = fields.Many2one('res.country.group', 'Country Group')
    country_group_country_ids = fields.Many2many('res.country', 'Country Group', related='country_group.country_ids')
    country = fields.Many2one('res.country', string="Country", domain="[('id','=', country_group_country_ids)]")
    localauthority1 = fields.Many2one('res.country.state', string="Local Authority", domain="[('country_id','=', country)]")
    nuts_level_1 = fields.Many2one('aspect.nuts', string="NUTS", domain="[('country','=', country)]")
    #nuts_level_2 = fields.Many2one('aspect.nuts', string="NUTS Level 2", domain="[('nuts_level','=', '2'),('country','=', country)]")
    #nuts_level_3 = fields.Many2one('aspect.nuts', string="NUTS Level 3", domain="[('nuts_level','=', '3'),('country','=', country)]")
    site = fields.Char(string="PeatMap")
    year_from =  fields.Selection(year_selection, string="Year From")
    year_to = fields.Selection(year_selection, string="Year to")
    publisher_char = fields.Char(string="Publisher")
    publisher = fields.Many2many('aspect.policy.publisher', string="Publisher")
    publisher_link = fields.Char(string="Publisher Link")
    data_link = fields.Char(string="Data Link")
    documentation_link = fields.Char(string="Documentation Link")
    stakholder_ids = fields.Many2many('aspect.policy.stakholder', string="Stakeholders")
    stakeholder_char = fields.Char(string="Stackholders")
    policy_files = fields.Many2many('ir.attachment', string="Files")
    excerpt = fields.Text(string="Excerpt")
    excerpt_english = fields.Text(string="Excerpt English")
    toc = fields.Text(string="Table of Content")
    toc_english = fields.Text(string="Table of Content (English)")
    abstract = fields.Text(string="Abstract")
    abstract_english = fields.Text(string="Abstract English")
    project_name = fields.Char(string="Project Name")
    project_details = fields.Text(string="Project Details")
    site_name = fields.Char(string="Site Name")
    site_type = fields.Many2one('aspect.policy.sitetype', string="Site Type")
    site_details = fields.Text( string="Details")
    site_thickness = fields.Char(string="Thickness")
    site_soil_type = fields.Char(string="Soil Type")

    geo_file = fields.Binary(string='Shape File')
    geo_multipolygon = fields.GeoMultiPolygon(string="Polygon", related='nuts_level_1.geo_multipolygon')

    state = fields.Selection([("Draft", "Draft"), ("Submitted", "Submitted"), ("Approved", "Approved"),("Cancelled", "Cancelled"),("Published", "Published")], string="State", default='Draft', tracking=True)
    law_policy = fields.Selection([("Law", "Law"), ("Policy", "Policy")], string="Law/Policy", tracking=True)

    created_by = fields.Many2one('res.users', string='Created-by', default=lambda self: self.env.user)
    created_date = fields.Date(string='Date', default=lambda self: fields.Date.today(), help="Submit date")

    submitted_by = fields.Many2one('res.users', string='Submitted by')
    submitted_date = fields.Date(string='Submitted Date')

    approved_by = fields.Many2one('res.users', string='Approved by')
    approved_date = fields.Date(string='Approved Date')

    cancelled_by = fields.Many2one('res.users', string='Cancelled by')
    cancelled_date = fields.Date(string='Cancelled Date')

    published_by = fields.Many2one('res.users', string='Published by')
    published_date = fields.Date(string='Published Date')

    keywords_text = fields.Char(string="Keywords", compute='_get_keywords', store=True)
    category_text = fields.Char(string="Categories", compute='_get_categories', store=True )
    language_text = fields.Char(string="Language", related='language.name', store=True)
    country_text = fields.Char(string="Country", related="country.name", store=True)
    localauthority_text = fields.Char(string="Local State", related="localauthority1.name")
    nut_text = fields.Char(string="Nut", related="nuts_level_1.name", store=True)
    stakholder_text = fields.Char(string="Stakholders Text", compute='_get_stakholder', store=True)
    publisher_text = fields.Char(string="Publisher Text", compute='_get_publishers', store=True)
    additional_info = fields.Text(string='Additioinal Information')
    active = fields.Boolean(string="Active", default=True)
    upload_status = fields.Text(string="Upload Log", readonly=True)
    is_uploaded = fields.Boolean(string="Is Uploaded", default=False)

    @api.model
    def sync_policies_to_postgis(self):
        """Sync policy records to remote PostGIS database on test server (140.203.155.91)."""
        conn_params = {
            "host": "140.203.155.91",
            "port": 5432,
            "database": "geoapp",
            "user": "postgres",
            "password": "P0stgr3sql",
        }

        try:
            conn = psycopg2.connect(**conn_params)
            cur = conn.cursor()
        except Exception as e:
            msg = f"PostGIS Connection failed: {e}"
            _logger.error(msg)
            return msg

        policies = self if self else self.env['aspect.policies'].search([('state', '=', 'Published')])

        def m2o_name(record):
            return record.name if record else ''

        def m2m_names(recordset):
            return ', '.join(recordset.mapped('name')) if recordset else ''

        records_to_insert = []

        for pol in policies:
            if pol.state != 'Published':
                cur.execute("DELETE FROM aspect_policy WHERE odoo_policy_id = %s", (pol.id,))
                conn.commit()
                continue

            geom_wkt = None
            if pol.geo_multipolygon:
                try:
                    if hasattr(pol.geo_multipolygon, 'wkt') and pol.geo_multipolygon.wkt:
                        geom_wkt = pol.geo_multipolygon.wkt
                    else:
                        raw_geom = str(pol.geo_multipolygon).strip()
                        if raw_geom and raw_geom not in ('False', 'None'):
                            geom_wkt = raw_geom
                except Exception as e:
                    _logger.warning(f"Failed to extract geometry for policy {pol.id}: {e}")
                    geom_wkt = None

            record = (
                pol.id,
                pol.name or '',
                pol.name_language or '',
                m2o_name(pol.primary_category),
                m2m_names(pol.category),
                pol.policy_level or '',
                m2o_name(pol.language),
                m2m_names(pol.keywords),
                m2o_name(pol.country),
                m2o_name(pol.localauthority1),
                m2o_name(pol.nuts_level_1),
                pol.year_from or '',
                pol.year_to or '',
                pol.publisher_char or '',
                m2m_names(pol.publisher),
                pol.publisher_link or '',
                pol.data_link or '',
                pol.documentation_link or '',
                m2m_names(pol.stakholder_ids),
                pol.stakeholder_char or '',
                pol.excerpt or '',
                pol.excerpt_english or '',
                pol.toc or '',
                pol.toc_english or '',
                pol.abstract or '',
                pol.abstract_english or '',
                geom_wkt,
                pol.state or '',
                pol.law_policy or '',
                '',  # additional_info
            )
            records_to_insert.append(record)

        if not records_to_insert:
            cur.close()
            conn.close()
            return "No published policies found to sync."

        insert_sql = """
        INSERT INTO aspect_policy (
            odoo_policy_id, name, name_language, primary_category, category,
            policy_level, language, keywords, country, localauthority1,
            nuts_level_1, year_from, year_to, publisher_char, publisher,
            publisher_link, data_link, documentation_link, stakholder_ids,
            stakeholder_char, excerpt, excerpt_english, toc, toc_english,
            abstract, abstract_english, geo_multipolygon, state, law_policy, additional_info
        )
        VALUES %s
        ON CONFLICT (odoo_policy_id) DO UPDATE SET
            name = EXCLUDED.name,
            name_language = EXCLUDED.name_language,
            primary_category = EXCLUDED.primary_category,
            category = EXCLUDED.category,
            policy_level = EXCLUDED.policy_level,
            language = EXCLUDED.language,
            keywords = EXCLUDED.keywords,
            country = EXCLUDED.country,
            localauthority1 = EXCLUDED.localauthority1,
            nuts_level_1 = EXCLUDED.nuts_level_1,
            year_from = EXCLUDED.year_from,
            year_to = EXCLUDED.year_to,
            publisher_char = EXCLUDED.publisher_char,
            publisher = EXCLUDED.publisher,
            publisher_link = EXCLUDED.publisher_link,
            data_link = EXCLUDED.data_link,
            documentation_link = EXCLUDED.documentation_link,
            stakholder_ids = EXCLUDED.stakholder_ids,
            stakeholder_char = EXCLUDED.stakeholder_char,
            excerpt = EXCLUDED.excerpt,
            excerpt_english = EXCLUDED.excerpt_english,
            toc = EXCLUDED.toc,
            toc_english = EXCLUDED.toc_english,
            abstract = EXCLUDED.abstract,
            abstract_english = EXCLUDED.abstract_english,
            geo_multipolygon = EXCLUDED.geo_multipolygon,
            state = EXCLUDED.state,
            law_policy = EXCLUDED.law_policy,
            additional_info = EXCLUDED.additional_info
        ;
        """

        try:
            execute_values(cur, insert_sql, records_to_insert, template=None, page_size=100)
            conn.commit()
            msg = f"Successfully synced {len(records_to_insert)} policies to PostGIS."
            _logger.info(msg)
        except Exception as e:
            conn.rollback()
            msg = f"Failed to insert policies: {e}"
            _logger.error(msg)
        finally:
            cur.close()
            conn.close()

        return msg

    @api.model
    def create(self, vals):
        res = super(aspectPolicies, self).create(vals)
        if res.state == 'Published':
            res.sync_policies_to_postgis()
        return res

    def write(self, vals):
        old_state = self.state
        res = super(aspectPolicies, self).write(vals)

        sync_result = self.sync_policies_to_postgis()
        _logger.info(f"PostGIS Sync Result: {sync_result}")

        new_state = vals.get('state')
        if new_state:
            if new_state == 'Published':
                self._upload_embeddings()
            elif old_state == 'Published' and new_state != 'Published':
                self._delete_embeddings()
        return res

    def _upload_embeddings(self):
        log = []
        for file in self.policy_files:
            self.is_uploaded = True
            file_data = base64.b64decode(file.datas)
            files = {'file': (file.name, file_data, 'application/pdf')}
            data = {
                'author': self.name,
                'language': self.language.name if self.language else '',
                'country': self.country.name if self.country else '',
                'region': self.policy_level,
                'record_id': str(self.id),
                'category': self.primary_category.name if self.primary_category else '',
                'active': 'true',
                'governance_level':self.policy_level
            }

            try:
                res = requests.post("http://140.203.155.51:8001/upload", data=data, files=files, timeout=60)
                if res.status_code == 200:
                    log.append(f"✅ Uploaded {file.name}")
                else:
                    log.append(f"❌ Failed {file.name}: {res.text}")
                    break  # Stop loop if any file fails
            except Exception as e:
                log.append(f"❌ Error uploading {file.name}: {str(e)}")
                break

        self.upload_status = "\n".join(log)

    def _delete_embeddings(self):
        try:
            res = requests.delete(f"http://140.203.155.51:8001/delete/{self.id}", timeout=30)
            if res.status_code == 200:
                self.upload_status = f"🗑️ Deleted embeddings for record {self.name}"
            else:
                self.upload_status = f"❌ Deletion failed: {res.text}"
        except Exception as e:
            self.upload_status = f"❌ Error during deletion: {str(e)}"

    @api.depends('category')
    def _get_categories(self):
        for record in self:
            if record.category:
                record.category_text = ', '.join([x.name for x in record.category])
            else:
                record.keywords_text = ' '

    @api.depends('keywords')
    def _get_keywords(self):
        for record in self:
            if record.keywords:
                record.keywords_text = ', '.join([x.name for x in record.keywords])
            else:
                record.keywords_text = ' '

    @api.depends('publisher')
    def _get_publishers(self):
        for record in self:
            if record.publisher:
                record.publisher_text = ', '.join([x.name for x in record.publisher])
            else:
                record.publisher_text = ' '

    @api.depends('stakholder_ids')
    def _get_stakholder(self):
        for record in self:
            if record.stakholder_ids:
                record.stakholder_text = ', '.join([x.name for x in record.stakholder_ids])
            else:
                record.stakholder_text = ' '

    @api.onchange('localauthority1','policy_level','country')
    def _onchange_country_state_id(self):
        for rec in self:
            if rec.policy_level=='Local' and rec.localauthority1:
                rec = self.env['aspect.nuts'].search([('country_state','=',self.localauthority1.id)])
                if rec:
                    self.nuts_level_1 = rec
                else:
                    self.nuts_level_1 = False
            elif rec.policy_level=='National' and rec.country:
                rec = self.env['aspect.nuts'].search([('country','=',self.country.id),('country_map','=',True)])
                if rec:
                    self.nuts_level_1 = rec
                else:
                    self.nuts_level_1 = False


    def submit_policy(self):
        self.state = 'Submitted'
        self.submitted_by = self.env.user
        self.submitted_date = fields.Date.today()

    def edit_policy(self):
        self.state = 'Draft'

    def approve_policy(self):
        self.state = 'Approved'
        self.approved_by = self.env.user
        self.approved_date = fields.Date.today()

    def cancel_policy(self):
        self.state = 'Cancelled'
        self.cancelled_by = self.env.user
        self.cancelled_date = fields.Date.today()

    def publish_policy(self):
        self.state = 'Published'
        self.published_by = self.env.user
        self.published_date = fields.Date.today()
