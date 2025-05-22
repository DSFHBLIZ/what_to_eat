-- deploy_search_recipes.sql
--
-- 统一部署搜索菜谱相关的所有函数
-- 按照依赖关系顺序执行

-- 1. 首先删除所有相关函数
DROP FUNCTION IF EXISTS search_recipes CASCADE;
DROP FUNCTION IF EXISTS filter_by_cuisine CASCADE;
DROP FUNCTION IF EXISTS filter_by_flavors CASCADE;
DROP FUNCTION IF EXISTS filter_by_difficulty CASCADE;
DROP FUNCTION IF EXISTS filter_by_dietary CASCADE;
DROP FUNCTION IF EXISTS filter_by_required_ingredient_categories CASCADE;
DROP FUNCTION IF EXISTS filter_by_required_condiment_categories CASCADE;
DROP FUNCTION IF EXISTS filter_by_forbidden_ingredients CASCADE;
DROP FUNCTION IF EXISTS filter_by_required_ingredients CASCADE;
DROP FUNCTION IF EXISTS filter_by_required_condiments CASCADE;
DROP FUNCTION IF EXISTS score_required_ingredients CASCADE;
DROP FUNCTION IF EXISTS score_optional_ingredients CASCADE;
DROP FUNCTION IF EXISTS score_required_condiments CASCADE;
DROP FUNCTION IF EXISTS score_optional_condiments CASCADE;
DROP FUNCTION IF EXISTS score_required_ingredient_categories CASCADE;
DROP FUNCTION IF EXISTS score_optional_ingredient_categories CASCADE;
DROP FUNCTION IF EXISTS score_required_condiment_categories CASCADE;
DROP FUNCTION IF EXISTS score_optional_condiment_categories CASCADE;
DROP FUNCTION IF EXISTS score_dish_name_keywords CASCADE;
DROP FUNCTION IF EXISTS score_search_query CASCADE;
DROP FUNCTION IF EXISTS score_semantic_search CASCADE;
DROP FUNCTION IF EXISTS embedding_semantic_similarity CASCADE;
DROP FUNCTION IF EXISTS calculate_total_score CASCADE;
DROP FUNCTION IF EXISTS normalize_optional_score CASCADE;
DROP FUNCTION IF EXISTS safe_jsonb_array CASCADE;
DROP FUNCTION IF EXISTS normalize_keyword CASCADE;
DROP FUNCTION IF EXISTS chinese_string_match CASCADE;
DROP FUNCTION IF EXISTS clean_text_array CASCADE;
DROP FUNCTION IF EXISTS has_elements CASCADE;
DROP FUNCTION IF EXISTS get_ingredient_match_score CASCADE;
DROP FUNCTION IF EXISTS get_category_match_score CASCADE;
DROP FUNCTION IF EXISTS ingredient_matches CASCADE;
DROP FUNCTION IF EXISTS category_matches CASCADE;
DROP FUNCTION IF EXISTS get_dish_name_match_score CASCADE;
DROP FUNCTION IF EXISTS cuisine_matches CASCADE; 