import json
from odoo import http, _
from odoo.exceptions import AccessError, MissingError
from odoo.http import request
import requests

import logging
_logger = logging.getLogger(__name__)

class aspectPortal(http.Controller):

    @http.route('/aspect/policy/<int:policy_id>', type='json', auth='public', csrf=False)

    def get_single_policy(self, policy_id):
        policy = request.env['aspect.policies'].sudo().browse(policy_id)

        if not policy.exists():
            return {'error': 'Policy not found'}

        # Prepare the data dictionary
        policy_data = {
            'id': policy.id,
            'name': policy.name,
            'name_language': policy.name_language,
            'type': policy.type,
            'primary_category': policy.primary_category.name if policy.primary_category else '',
            'category': [cat.name for cat in policy.category],
            'policy_level': policy.policy_level,
            'language': policy.language.name if policy.language else '',
            'keywords': [kw.name for kw in policy.keywords],
            'country_group': policy.country_group.name if policy.country_group else '',
            'country': policy.country.name if policy.country else '',
            'localauthority1': policy.localauthority1.name if policy.localauthority1 else '',
            'nuts_level_1': policy.nuts_level_1.name if policy.nuts_level_1 else '',
            'year_from': policy.year_from,
            'year_to': policy.year_to,
            'publisher_char': policy.publisher_char,
            'publisher': [pub.name for pub in policy.publisher],
            'publisher_link': policy.publisher_link,
            'data_link': policy.data_link,
            'documentation_link': policy.documentation_link,
            'stakholder_ids': [stk.name for stk in policy.stakholder_ids],
            'excerpt': policy.excerpt,
            'excerpt_english': policy.excerpt_english,
            'abstract': policy.abstract,
            'abstract_english': policy.abstract_english,
            'additional_info': policy.additional_info,
            'toc': policy.toc,
            'toc_english': policy.toc_english,
            'state': policy.state,
            'active': policy.active,
        }

        return {'policy': policy_data}

    @http.route('/aspect/reset_password', type='http', auth='public', csrf=False, methods=['POST'])
    def reset_password(self, **kwargs):
        import json
        data = json.loads(request.httprequest.data)

        login = data.get("login")
        new_password = data.get("new_password")

        if not login or not new_password:
            return request.make_response(json.dumps({"error": "Login and new_password are required."}), headers=[('Content-Type', 'application/json')])

        user = request.env['res.users'].sudo().search([('login', '=', login)], limit=1)
        if not user:
            return request.make_response(json.dumps({"error": "User not found."}), headers=[('Content-Type', 'application/json')])

        user.sudo().write({'password': new_password})
        return request.make_response(json.dumps({"success": True, "message": f"Password reset for {login}"}), headers=[('Content-Type', 'application/json')])

    @http.route('/aspect/ask-question', type='http', auth='public', methods=['GET', 'POST'], csrf=False)
    def ask_question(self, **kw):
        payload = {}
        # 1. Try reading raw JSON body
        if request.httprequest.data:
            try:
                payload = json.loads(request.httprequest.data.decode('utf-8'))
            except Exception:
                payload = {}

        # 2. Fallback to form-encoded / query params if raw JSON was empty
        if not payload:
            payload = kw

        # 3. Extract parameters supporting both JSON-RPC and standard JSON
        params = payload.get("params") if isinstance(payload.get("params"), dict) else payload
        question = params.get("question") if isinstance(params, dict) else payload.get("question")
        filters = params.get("filters", {}) if isinstance(params, dict) else payload.get("filters", {})

        if not question:
            res_err = {
                'status': 400,
                'message': 'Question is required.',
                'response': None
            }
            return request.make_response(
                json.dumps({'result': res_err, **res_err}),
                headers=[('Content-Type', 'application/json')],
                status=400
            )

        try:
            fastapi_url = "http://140.203.155.51:8001/ask"
            query_params = {"query": question}

            # Include metadata if present
            allowed_filters = ["language", "country", "category", "governance_level"]
            for key in allowed_filters:
                if isinstance(filters, dict) and key in filters:
                    query_params[key] = filters[key]

            response = requests.get(
                fastapi_url,
                params=query_params,
                headers={'accept': 'application/json'},
                timeout=120
            )

            if response.status_code == 200:
                json_data = response.json()
                resp_payload = {
                    'status': 200,
                    'message': 'Success',
                    'response': {
                        'answer': json_data.get("answer"),
                        'sources': json_data.get("sources", [])
                    }
                }
            else:
                resp_payload = {
                    'status': response.status_code,
                    'message': f"FastAPI error: {response.text}",
                    'response': None
                }

        except Exception as e:
            _logger.error(f"FastAPI exception: {e}")
            resp_payload = {
                'status': 500,
                'message': f"Server error: {str(e)}",
                'response': None
            }

        return request.make_response(
            json.dumps({'jsonrpc': '2.0', 'id': None, 'result': resp_payload, **resp_payload}),
            headers=[('Content-Type', 'application/json')]
        )

    @http.route('/aspect/category/',  type='json', auth='public', method=['POST'], csrf=False)
    def aspect_categories(self, **data):
        countries = []
        for each_ctry in request.env['aspect.policy.category'].sudo().search([]):
            vals = {
                 'id': each_ctry.id,
                'name': each_ctry.name,
                }
            countries.append(vals)
        data = {'status': 200, 'response': countries, 'message':'success'}
        return data

    @http.route('/aspect/policy/<int:policy_id>/files', type='json', auth='public', csrf=False)
    def get_policy_files(self, policy_id):
        policy = request.env['aspect.policies'].sudo().browse(policy_id)
        if not policy.exists():
            return {'error': 'Policy not found'}

        base_url = request.httprequest.host_url.rstrip('/')
        files = [{
            'id': file.id,
            'name': file.name,
            'url': f"{base_url}/web/content/{file.id}?download=true"
        } for file in policy.policy_files]

        return {'attachments': files}

    @http.route('/aspect/countries/',  type='json', auth='public', method=['POST'], csrf=False)
    def aspect_countries(self, **data):
        countries = []
        ee_countries = request.env['res.country.group'].sudo().search([('id','=',1)])
        for each_ctry in ee_countries.country_ids:
            vals = {
                 'id': each_ctry.id,
                'name': each_ctry.name,
                }
            countries.append(vals)
        data = {'status': 200, 'response': countries, 'message':'success'}
        return data

    @http.route('/aspect/nuts/<int:country_id>',  type='json', auth='public', method=['POST'], csrf=False)
    def aspect_nuts(self, country_id, **data):
        countries = []
        for each_ctry in request.env['aspect.nuts'].sudo().search([('country','=',country_id),('state_map','=',False),('country_map','=',False)]):
            vals = {
                'id': each_ctry.id,
                'country_id': each_ctry.country.id,
                'country': each_ctry.country.name,
                'name': each_ctry.name,
                }
            countries.append(vals)
        data = {'status': 200, 'response': countries, 'message':'success'}
        return data

    @http.route('/aspect/state/<int:country_id>',  type='json', auth='public', method=['POST'], csrf=False)
    def aspect_state(self, country_id, **data):
        countries = []
        for each_ctry in request.env['res.country.state'].sudo().search([('country_id','=',country_id)]):
            vals = {
                'id': each_ctry.id,
                'country_id': each_ctry.country_id.id,
                'country': each_ctry.country_id.name,
                'name': each_ctry.name,
                }
            countries.append(vals)
        data = {'status': 200, 'response': countries, 'message':'success'}
        return data

    @http.route('/aspect/create_policy/',  type='json', auth='public', method=['POST'], csrf=False)
    def aspect_createpolicy(self, **data):
        if data:
            _logger.info(data)
            _logger.info("-----------------------")
            request.env['aspect.policies'].sudo().create({
                'name': data['name'],
                'name_language': data['name_language'],
                'type': 'Policy',
                'category': [(6,  0,  data['category'])],
                'stakholder_ids': [(6,  0,  data['stakholder_ids'])],
                'publisher': [(6,  0,  data['publisher'])],
                'keywords': [(6,  0,  data['keywords'])],
                'policy_level': data['policy_level'],
                'country_group': 1,
                'country': data['country'],
                'localauthority1': data['localauthority1'],
                'nuts_level_1': data['nuts_level_1'],
                'year_from': data['year_from'],
                'year_to': data['year_to'],
                'publisher_char': data['publisher_char'],
                'publisher_link': data['publisher_link'],
                'data_link': data['data_link'],
                'excerpt': data['excerpt'],
                'excerpt_english': data['excerpt_english'],
                'abstract': data['abstract'],
                'abstract_english': data['abstract_english'],
                'additional_info': data['additional_info'],
                'state': 'Draft',
            })
        data = {'status': 200, 'response': [], 'message':'success'}
        return data

    @http.route('/aspect/signup/',  type='json', auth='public', method=['POST'], csrf=False)
    def aspect_signup(self, **data):
        if data:
            request.env['res.users'].sudo().create({
                'name': data['name'],
                'email': data['login'],
                'image_1920': False,
                'login': data['login'],
                'groups_id': [(6,  0,  [10])],
                'password': data['password'],
                'company_ids':  [(6,  0,  [1])]
            })
        data = {'status': 200, 'response': [], 'message':'success'}
        return data

    @http.route('/aspect/stakeholders/<int:country_id>',  type='json', auth='public', method=['POST'], csrf=False)
    def aspect_stakeholders(self, country_id=None, **data):
        stakeholder = []
        srch = []
        if country_id or country_id != 0:
            srch = [('country','in',[251,252, country_id])]
        for each_skh in request.env['aspect.policy.stakholder'].sudo().search(srch):
            vals = {
                 'id': each_skh.id,
                'name': each_skh.name,
                'country': each_skh.country.name,
                'country_id':each_skh.country.id,
                'stakeholder_link': each_skh.stakeholder_link,
                'level': each_skh.stakeholder_level,
                'description': each_skh.description,
                }
            stakeholder.append(vals)
        data = {'status': 200, 'response': stakeholder, 'message':'success'}
        return data

    @http.route('/aspect/publishers/<int:country_id>',  type='json', auth='public', method=['POST'], csrf=False)
    def aspect_publishers(self, country_id, **data):
        publishers = []
        srch = []
        if country_id or country_id != 0:
            srch = [('country','in',[251,252, country_id])]
        for each_skh in request.env['aspect.policy.publisher'].sudo().search(srch):
            vals = {
                 'id': each_skh.id,
                'name': each_skh.name,
                'country': each_skh.country.name,
                'country_id': each_skh.country.id,
                'publisher_link': each_skh.publisher_link,
                'description': each_skh.description,
                }
            publishers.append(vals)
        data = {'status': 200, 'response': publishers, 'message':'success'}
        return data

    @http.route('/aspect/policies/',  type='json', auth='public')
    def aspect_policies(self, **data):
        policies = []
        for each_policy in request.env['aspect.policies'].sudo().search([('type','=','Policy'),('state','=','Published')]):
            vals = {
                 'id': each_policy.id,
                'name': each_policy.name,
                'name_language': each_policy.name_language,
                'primary_category': each_policy.primary_category.name,
                'category': [x.name for x in each_policy.category],
                'policy_level': each_policy.policy_level,
                'language': each_policy.language.name,
                'keywords': [x.name for x in each_policy.keywords],
                'country': each_policy.country.name,
                'localauthority': each_policy.localauthority1.name,
                'nuts_level': each_policy.nuts_level_1.name,
                'year_from': each_policy.year_from,
                'year_to': each_policy.year_to,
                'publisher': [x.name for x in each_policy.publisher],
                'publisher_link': each_policy.publisher_link,
                'data_link': each_policy.data_link,
                'documentation_link': each_policy.documentation_link,
                'stakholder_ids': [x.name for x in each_policy.stakholder_ids],
                'excerpt': each_policy.excerpt,
                'excerpt_english': each_policy.excerpt_english,
                'abstract': each_policy.abstract,
                'abstract_english': each_policy.abstract_english,
                'toc': each_policy.toc,
                'toc_english': each_policy.toc_english,
                }
            policies.append(vals)
        data = {'status': 200, 'response': policies, 'message':'success'}
        return data


    @http.route('/aspect/keywords/',  type='json', auth='public')
    def aspect_keywords(self, **data):
        keywords = []
        for each_policy in request.env['aspect.policy.keywords'].sudo().search([]):
            relations = []
            for each_relation in each_policy.relation:
                relation_dict = {'language':each_relation.name.name, 'language_mapping':[x.name for x in each_relation.keyword_relation]}
                relations.append(relation_dict)
            vals = {
                 'id': each_policy.id,
                'name': each_policy.name,
                'description': each_policy.description,
                'language': each_policy.language.name,
                'relation': relations
                }
            keywords.append(vals)
            #_logger.info('-----------------')
            #_logger.info(keywords)
        data = {'status': 200, 'response': keywords, 'message':'success'}
        return data

    @http.route('/aspect/languages/',  type='json', auth='public')
    def aspect_languages(self, **data):
        langs = []
        for each_lang in request.env['res.lang'].sudo().search([('active','=',True)]):
            vals = {
                 'id': each_lang.id,
                'name': each_lang.name,
                }
            langs.append(vals)
        data = {'status': 200, 'response': langs, 'message':'success'}
        return data