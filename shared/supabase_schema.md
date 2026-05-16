## Table `categories`

### Columns

| Name          | Type   | Constraints      |
| ------------- | ------ | ---------------- |
| `id`          | `int8` | Primary Identity |
| `name`        | `text` |                  |
| `slug`        | `text` | Unique           |
| `market`      | `text` |                  |
| `description` | `text` | Nullable         |

## Table `comments`

### Columns

| Name         | Type          | Constraints      |
| ------------ | ------------- | ---------------- |
| `id`         | `int8`        | Primary Identity |
| `post_id`    | `int8`        |                  |
| `author_id`  | `int8`        |                  |
| `content`    | `text`        |                  |
| `created_at` | `timestamptz` |                  |
| `updated_at` | `timestamptz` |                  |

## Table `company_evaluation_rubrics`

### Columns

| Name             | Type          | Constraints      |
| ---------------- | ------------- | ---------------- |
| `id`             | `int8`        | Primary Identity |
| `company_id`     | `text`        |                  |
| `company_name`   | `text`        |                  |
| `target_role`    | `text`        |                  |
| `total_weight`   | `int4`        |                  |
| `criteria`       | `jsonb`       |                  |
| `rubric_summary` | `text`        | Nullable         |
| `generated_at`   | `timestamptz` | Nullable         |
| `created_at`     | `timestamptz` |                  |
| `updated_at`     | `timestamptz` |                  |

## Table `company_hiring_signals`

### Columns

| Name                             | Type          | Constraints      |
| -------------------------------- | ------------- | ---------------- |
| `id`                             | `int8`        | Primary Identity |
| `company_id`                     | `text`        | Unique           |
| `company_name`                   | `text`        |                  |
| `country`                        | `text`        |                  |
| `industry`                       | `text`        |                  |
| `roles`                          | `_text`       | Nullable         |
| `required_technical_skills`      | `_text`       | Nullable         |
| `preferred_technical_skills`     | `_text`       | Nullable         |
| `language_expectation`           | `_text`       | Nullable         |
| `work_style`                     | `_text`       | Nullable         |
| `company_values`                 | `_text`       | Nullable         |
| `preferred_soft_skills`          | `_text`       | Nullable         |
| `evaluation_signals`             | `_text`       | Nullable         |
| `risk_concerns`                  | `_text`       | Nullable         |
| `recommended_candidate_evidence` | `_text`       | Nullable         |
| `extracted_summary`              | `text`        | Nullable         |
| `confidence_score`               | `numeric`     | Nullable         |
| `source_ids`                     | `_text`       | Nullable         |
| `created_at`                     | `timestamptz` |                  |
| `updated_at`                     | `timestamptz` |                  |

## Table `company_job_profiles`

### Columns

| Name                    | Type          | Constraints      |
| ----------------------- | ------------- | ---------------- |
| `id`                    | `int8`        | Primary Identity |
| `company_id`            | `text`        |                  |
| `company_name`          | `text`        |                  |
| `role_id`               | `text`        | Unique           |
| `role_title`            | `text`        |                  |
| `country`               | `text`        |                  |
| `salary_min`            | `int8`        | Nullable         |
| `salary_max`            | `int8`        | Nullable         |
| `salary_currency`       | `text`        |                  |
| `salary_note`           | `text`        | Nullable         |
| `starting_salary_min`   | `int8`        | Nullable         |
| `starting_salary_max`   | `int8`        | Nullable         |
| `starting_salary_currency` | `text`     | Nullable         |
| `starting_salary_note`  | `text`        | Nullable         |
| `average_annual_salary` | `int8`        | Nullable         |
| `average_annual_salary_note` | `text`   | Nullable         |
| `average_tenure_years`  | `numeric`     | Nullable         |
| `salary_last_checked_at` | `date`       | Nullable         |
| `salary_data_quality_notes` | `_text`   | Nullable         |
| `salary_source_links`   | `jsonb`       | Nullable         |
| `locations`             | `_text`       | Nullable         |
| `required_tech_stacks`  | `_text`       | Nullable         |
| `preferred_tech_stacks` | `_text`       | Nullable         |
| `required_languages`    | `jsonb`       |                  |
| `preferred_languages`   | `jsonb`       | Nullable         |
| `experience_min_years`  | `int4`        | Nullable         |
| `experience_max_years`  | `int4`        | Nullable         |
| `work_style`            | `text`        |                  |
| `company_type`          | `text`        | Nullable         |
| `role_category`         | `text`        | Nullable         |
| `rubric_id`             | `text`        | Nullable         |
| `source_confidence`     | `text`        | Nullable         |
| `source_urls`           | `_text`       | Nullable         |
| `notes`                 | `text`        | Nullable         |
| `created_at`            | `timestamptz` |                  |
| `updated_at`            | `timestamptz` |                  |

## Table `cvs`

### Columns

| Name                   | Type          | Constraints      |
| ---------------------- | ------------- | ---------------- |
| `id`                   | `int8`        | Primary Identity |
| `developer_profile_id` | `int8`        |                  |
| `contents`             | `jsonb`       |                  |
| `created_at`           | `timestamptz` |                  |
| `updated_at`           | `timestamptz` |                  |

## Table `developer_profiles`

### Columns

| Name                      | Type          | Constraints      |
| ------------------------- | ------------- | ---------------- |
| `id`                      | `int8`        | Primary Identity |
| `profile_id`              | `int8`        | Unique           |
| `full_name`               | `text`        | Nullable         |
| `nationality`             | `text`        | Nullable         |
| `target_country`          | `text`        | Nullable         |
| `target_role`             | `text`        | Nullable         |
| `tech_stack`              | `_text`       | Nullable         |
| `portfolio_url`           | `text`        | Nullable         |
| `github_url`              | `text`        | Nullable         |
| `self_introduction`       | `text`        | Nullable         |
| `key_project_experience`  | `text`        | Nullable         |
| `created_at`              | `timestamptz` |                  |
| `updated_at`              | `timestamptz` |                  |
| `language_certifications` | `jsonb`       | Nullable         |
| `preferred_salary_min`    | `int8`        | Nullable         |
| `preferred_salary_max`    | `int8`        | Nullable         |
| `preferred_currency`      | `text`        | Nullable         |
| `preferred_locations`     | `_text`       | Nullable         |
| `work_style_preference`   | `text`        | Nullable         |
| `relocation_available`    | `bool`        | Nullable         |
| `visa_support_needed`     | `bool`        | Nullable         |
| `motivation`              | `text`        | Nullable         |
| `concerns`                | `_text`       | Nullable         |
| `years_of_experience`     | `int4`        | Nullable         |
| `target_roles`            | `_text`       | Nullable         |
| `preferred_company_types` | `_text`       | Nullable         |

## Table `post_likes`

### Columns

| Name         | Type          | Constraints |
| ------------ | ------------- | ----------- |
| `post_id`    | `int8`        | Primary     |
| `user_id`    | `uuid`        | Primary     |
| `created_at` | `timestamptz` |             |

## Table `posts`

### Columns

| Name          | Type          | Constraints      |
| ------------- | ------------- | ---------------- |
| `id`          | `int8`        | Primary Identity |
| `author_id`   | `int8`        |                  |
| `category_id` | `int8`        |                  |
| `title`       | `text`        |                  |
| `content`     | `text`        |                  |
| `like_count`  | `int4`        |                  |
| `created_at`  | `timestamptz` |                  |
| `updated_at`  | `timestamptz` |                  |
| `image_url`   | `text`        | Nullable         |

## Table `profiles`

### Columns

| Name         | Type          | Constraints      |
| ------------ | ------------- | ---------------- |
| `id`         | `int8`        | Primary Identity |
| `user_id`    | `uuid`        | Unique           |
| `role`       | `text`        |                  |
| `market`     | `text`        |                  |
| `created_at` | `timestamptz` |                  |
| `updated_at` | `timestamptz` |                  |

## Table `resume_context_mappings`

### Columns

| Name                     | Type          | Constraints |
| ------------------------ | ------------- | ----------- |
| `id`                     | `text`        | Primary     |
| `employee_profile_id`    | `int8`        | Nullable    |
| `target_locale`          | `text`        |             |
| `detected_source_locale` | `text`        | Nullable    |
| `request`                | `jsonb`       |             |
| `response`               | `jsonb`       |             |
| `created_at`             | `timestamptz` |             |
