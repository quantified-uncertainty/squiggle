{ fetchurl, fetchgit, linkFarm, runCommand, gnutar }: rec {
  offline_cache = linkFarm "offline" packages;
  packages = [
    {
      name = "_ant_design_create_react_context___create_react_context_0.2.5.tgz";
      path = fetchurl {
        name = "_ant_design_create_react_context___create_react_context_0.2.5.tgz";
        url  = "https://registry.yarnpkg.com/@ant-design/create-react-context/-/create-react-context-0.2.5.tgz";
        sha1 = "f5f5a9163b4772097712837397ad30e22e79f858";
      };
    }
    {
      name = "_ant_design_icons_react___icons_react_1.1.5.tgz";
      path = fetchurl {
        name = "_ant_design_icons_react___icons_react_1.1.5.tgz";
        url  = "https://registry.yarnpkg.com/@ant-design/icons-react/-/icons-react-1.1.5.tgz";
        sha1 = "1b03da8dcced2a4bb982ef7b25c1d24014c35a68";
      };
    }
    {
      name = "_ant_design_icons___icons_1.2.1.tgz";
      path = fetchurl {
        name = "_ant_design_icons___icons_1.2.1.tgz";
        url  = "https://registry.yarnpkg.com/@ant-design/icons/-/icons-1.2.1.tgz";
        sha1 = "8e19301b1433ec67d6bbd0e892782e2ade561ff9";
      };
    }
    {
      name = "_babel_code_frame___code_frame_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_code_frame___code_frame_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/code-frame/-/code-frame-7.8.3.tgz";
        sha1 = "33e25903d7481181534e12ec0a25f16b6fcf419e";
      };
    }
    {
      name = "_babel_code_frame___code_frame_7.0.0.tgz";
      path = fetchurl {
        name = "_babel_code_frame___code_frame_7.0.0.tgz";
        url  = "https://registry.yarnpkg.com/@babel/code-frame/-/code-frame-7.0.0.tgz";
        sha1 = "06e2ab19bdb535385559aabb5ba59729482800f8";
      };
    }
    {
      name = "_babel_compat_data___compat_data_7.9.6.tgz";
      path = fetchurl {
        name = "_babel_compat_data___compat_data_7.9.6.tgz";
        url  = "https://registry.yarnpkg.com/@babel/compat-data/-/compat-data-7.9.6.tgz";
        sha1 = "3f604c40e420131affe6f2c8052e9a275ae2049b";
      };
    }
    {
      name = "_babel_core___core_7.3.4.tgz";
      path = fetchurl {
        name = "_babel_core___core_7.3.4.tgz";
        url  = "https://registry.yarnpkg.com/@babel/core/-/core-7.3.4.tgz";
        sha1 = "921a5a13746c21e32445bf0798680e9d11a6530b";
      };
    }
    {
      name = "_babel_core___core_7.9.6.tgz";
      path = fetchurl {
        name = "_babel_core___core_7.9.6.tgz";
        url  = "https://registry.yarnpkg.com/@babel/core/-/core-7.9.6.tgz";
        sha1 = "d9aa1f580abf3b2286ef40b6904d390904c63376";
      };
    }
    {
      name = "_babel_generator___generator_7.3.4.tgz";
      path = fetchurl {
        name = "_babel_generator___generator_7.3.4.tgz";
        url  = "https://registry.yarnpkg.com/@babel/generator/-/generator-7.3.4.tgz";
        sha1 = "9aa48c1989257877a9d971296e5b73bfe72e446e";
      };
    }
    {
      name = "_babel_generator___generator_7.9.6.tgz";
      path = fetchurl {
        name = "_babel_generator___generator_7.9.6.tgz";
        url  = "https://registry.yarnpkg.com/@babel/generator/-/generator-7.9.6.tgz";
        sha1 = "5408c82ac5de98cda0d77d8124e99fa1f2170a43";
      };
    }
    {
      name = "_babel_helper_annotate_as_pure___helper_annotate_as_pure_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_helper_annotate_as_pure___helper_annotate_as_pure_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/helper-annotate-as-pure/-/helper-annotate-as-pure-7.8.3.tgz";
        sha1 = "60bc0bc657f63a0924ff9a4b4a0b24a13cf4deee";
      };
    }
    {
      name = "_babel_helper_builder_binary_assignment_operator_visitor___helper_builder_binary_assignment_operator_visitor_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_helper_builder_binary_assignment_operator_visitor___helper_builder_binary_assignment_operator_visitor_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/helper-builder-binary-assignment-operator-visitor/-/helper-builder-binary-assignment-operator-visitor-7.8.3.tgz";
        sha1 = "c84097a427a061ac56a1c30ebf54b7b22d241503";
      };
    }
    {
      name = "_babel_helper_builder_react_jsx_experimental___helper_builder_react_jsx_experimental_7.9.5.tgz";
      path = fetchurl {
        name = "_babel_helper_builder_react_jsx_experimental___helper_builder_react_jsx_experimental_7.9.5.tgz";
        url  = "https://registry.yarnpkg.com/@babel/helper-builder-react-jsx-experimental/-/helper-builder-react-jsx-experimental-7.9.5.tgz";
        sha1 = "0b4b3e04e6123f03b404ca4dfd6528fe6bb92fe3";
      };
    }
    {
      name = "_babel_helper_builder_react_jsx___helper_builder_react_jsx_7.9.0.tgz";
      path = fetchurl {
        name = "_babel_helper_builder_react_jsx___helper_builder_react_jsx_7.9.0.tgz";
        url  = "https://registry.yarnpkg.com/@babel/helper-builder-react-jsx/-/helper-builder-react-jsx-7.9.0.tgz";
        sha1 = "16bf391990b57732700a3278d4d9a81231ea8d32";
      };
    }
    {
      name = "_babel_helper_compilation_targets___helper_compilation_targets_7.9.6.tgz";
      path = fetchurl {
        name = "_babel_helper_compilation_targets___helper_compilation_targets_7.9.6.tgz";
        url  = "https://registry.yarnpkg.com/@babel/helper-compilation-targets/-/helper-compilation-targets-7.9.6.tgz";
        sha1 = "1e05b7ccc9d38d2f8b40b458b380a04dcfadd38a";
      };
    }
    {
      name = "_babel_helper_create_regexp_features_plugin___helper_create_regexp_features_plugin_7.8.8.tgz";
      path = fetchurl {
        name = "_babel_helper_create_regexp_features_plugin___helper_create_regexp_features_plugin_7.8.8.tgz";
        url  = "https://registry.yarnpkg.com/@babel/helper-create-regexp-features-plugin/-/helper-create-regexp-features-plugin-7.8.8.tgz";
        sha1 = "5d84180b588f560b7864efaeea89243e58312087";
      };
    }
    {
      name = "_babel_helper_define_map___helper_define_map_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_helper_define_map___helper_define_map_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/helper-define-map/-/helper-define-map-7.8.3.tgz";
        sha1 = "a0655cad5451c3760b726eba875f1cd8faa02c15";
      };
    }
    {
      name = "_babel_helper_explode_assignable_expression___helper_explode_assignable_expression_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_helper_explode_assignable_expression___helper_explode_assignable_expression_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/helper-explode-assignable-expression/-/helper-explode-assignable-expression-7.8.3.tgz";
        sha1 = "a728dc5b4e89e30fc2dfc7d04fa28a930653f982";
      };
    }
    {
      name = "_babel_helper_function_name___helper_function_name_7.9.5.tgz";
      path = fetchurl {
        name = "_babel_helper_function_name___helper_function_name_7.9.5.tgz";
        url  = "https://registry.yarnpkg.com/@babel/helper-function-name/-/helper-function-name-7.9.5.tgz";
        sha1 = "2b53820d35275120e1874a82e5aabe1376920a5c";
      };
    }
    {
      name = "_babel_helper_get_function_arity___helper_get_function_arity_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_helper_get_function_arity___helper_get_function_arity_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/helper-get-function-arity/-/helper-get-function-arity-7.8.3.tgz";
        sha1 = "b894b947bd004381ce63ea1db9f08547e920abd5";
      };
    }
    {
      name = "_babel_helper_hoist_variables___helper_hoist_variables_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_helper_hoist_variables___helper_hoist_variables_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/helper-hoist-variables/-/helper-hoist-variables-7.8.3.tgz";
        sha1 = "1dbe9b6b55d78c9b4183fc8cdc6e30ceb83b7134";
      };
    }
    {
      name = "_babel_helper_member_expression_to_functions___helper_member_expression_to_functions_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_helper_member_expression_to_functions___helper_member_expression_to_functions_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/helper-member-expression-to-functions/-/helper-member-expression-to-functions-7.8.3.tgz";
        sha1 = "659b710498ea6c1d9907e0c73f206eee7dadc24c";
      };
    }
    {
      name = "_babel_helper_module_imports___helper_module_imports_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_helper_module_imports___helper_module_imports_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/helper-module-imports/-/helper-module-imports-7.8.3.tgz";
        sha1 = "7fe39589b39c016331b6b8c3f441e8f0b1419498";
      };
    }
    {
      name = "_babel_helper_module_transforms___helper_module_transforms_7.9.0.tgz";
      path = fetchurl {
        name = "_babel_helper_module_transforms___helper_module_transforms_7.9.0.tgz";
        url  = "https://registry.yarnpkg.com/@babel/helper-module-transforms/-/helper-module-transforms-7.9.0.tgz";
        sha1 = "43b34dfe15961918707d247327431388e9fe96e5";
      };
    }
    {
      name = "_babel_helper_optimise_call_expression___helper_optimise_call_expression_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_helper_optimise_call_expression___helper_optimise_call_expression_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/helper-optimise-call-expression/-/helper-optimise-call-expression-7.8.3.tgz";
        sha1 = "7ed071813d09c75298ef4f208956006b6111ecb9";
      };
    }
    {
      name = "_babel_helper_plugin_utils___helper_plugin_utils_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_helper_plugin_utils___helper_plugin_utils_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/helper-plugin-utils/-/helper-plugin-utils-7.8.3.tgz";
        sha1 = "9ea293be19babc0f52ff8ca88b34c3611b208670";
      };
    }
    {
      name = "_babel_helper_regex___helper_regex_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_helper_regex___helper_regex_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/helper-regex/-/helper-regex-7.8.3.tgz";
        sha1 = "139772607d51b93f23effe72105b319d2a4c6965";
      };
    }
    {
      name = "_babel_helper_remap_async_to_generator___helper_remap_async_to_generator_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_helper_remap_async_to_generator___helper_remap_async_to_generator_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/helper-remap-async-to-generator/-/helper-remap-async-to-generator-7.8.3.tgz";
        sha1 = "273c600d8b9bf5006142c1e35887d555c12edd86";
      };
    }
    {
      name = "_babel_helper_replace_supers___helper_replace_supers_7.9.6.tgz";
      path = fetchurl {
        name = "_babel_helper_replace_supers___helper_replace_supers_7.9.6.tgz";
        url  = "https://registry.yarnpkg.com/@babel/helper-replace-supers/-/helper-replace-supers-7.9.6.tgz";
        sha1 = "03149d7e6a5586ab6764996cd31d6981a17e1444";
      };
    }
    {
      name = "_babel_helper_simple_access___helper_simple_access_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_helper_simple_access___helper_simple_access_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/helper-simple-access/-/helper-simple-access-7.8.3.tgz";
        sha1 = "7f8109928b4dab4654076986af575231deb639ae";
      };
    }
    {
      name = "_babel_helper_split_export_declaration___helper_split_export_declaration_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_helper_split_export_declaration___helper_split_export_declaration_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/helper-split-export-declaration/-/helper-split-export-declaration-7.8.3.tgz";
        sha1 = "31a9f30070f91368a7182cf05f831781065fc7a9";
      };
    }
    {
      name = "_babel_helper_validator_identifier___helper_validator_identifier_7.9.5.tgz";
      path = fetchurl {
        name = "_babel_helper_validator_identifier___helper_validator_identifier_7.9.5.tgz";
        url  = "https://registry.yarnpkg.com/@babel/helper-validator-identifier/-/helper-validator-identifier-7.9.5.tgz";
        sha1 = "90977a8e6fbf6b431a7dc31752eee233bf052d80";
      };
    }
    {
      name = "_babel_helper_wrap_function___helper_wrap_function_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_helper_wrap_function___helper_wrap_function_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/helper-wrap-function/-/helper-wrap-function-7.8.3.tgz";
        sha1 = "9dbdb2bb55ef14aaa01fe8c99b629bd5352d8610";
      };
    }
    {
      name = "_babel_helpers___helpers_7.9.6.tgz";
      path = fetchurl {
        name = "_babel_helpers___helpers_7.9.6.tgz";
        url  = "https://registry.yarnpkg.com/@babel/helpers/-/helpers-7.9.6.tgz";
        sha1 = "092c774743471d0bb6c7de3ad465ab3d3486d580";
      };
    }
    {
      name = "_babel_highlight___highlight_7.9.0.tgz";
      path = fetchurl {
        name = "_babel_highlight___highlight_7.9.0.tgz";
        url  = "https://registry.yarnpkg.com/@babel/highlight/-/highlight-7.9.0.tgz";
        sha1 = "4e9b45ccb82b79607271b2979ad82c7b68163079";
      };
    }
    {
      name = "_babel_parser___parser_7.3.4.tgz";
      path = fetchurl {
        name = "_babel_parser___parser_7.3.4.tgz";
        url  = "https://registry.yarnpkg.com/@babel/parser/-/parser-7.3.4.tgz";
        sha1 = "a43357e4bbf4b92a437fb9e465c192848287f27c";
      };
    }
    {
      name = "_babel_parser___parser_7.9.6.tgz";
      path = fetchurl {
        name = "_babel_parser___parser_7.9.6.tgz";
        url  = "https://registry.yarnpkg.com/@babel/parser/-/parser-7.9.6.tgz";
        sha1 = "3b1bbb30dabe600cd72db58720998376ff653bc7";
      };
    }
    {
      name = "_babel_plugin_proposal_async_generator_functions___plugin_proposal_async_generator_functions_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_proposal_async_generator_functions___plugin_proposal_async_generator_functions_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-proposal-async-generator-functions/-/plugin-proposal-async-generator-functions-7.8.3.tgz";
        sha1 = "bad329c670b382589721b27540c7d288601c6e6f";
      };
    }
    {
      name = "_babel_plugin_proposal_dynamic_import___plugin_proposal_dynamic_import_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_proposal_dynamic_import___plugin_proposal_dynamic_import_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-proposal-dynamic-import/-/plugin-proposal-dynamic-import-7.8.3.tgz";
        sha1 = "38c4fe555744826e97e2ae930b0fb4cc07e66054";
      };
    }
    {
      name = "_babel_plugin_proposal_json_strings___plugin_proposal_json_strings_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_proposal_json_strings___plugin_proposal_json_strings_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-proposal-json-strings/-/plugin-proposal-json-strings-7.8.3.tgz";
        sha1 = "da5216b238a98b58a1e05d6852104b10f9a70d6b";
      };
    }
    {
      name = "_babel_plugin_proposal_nullish_coalescing_operator___plugin_proposal_nullish_coalescing_operator_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_proposal_nullish_coalescing_operator___plugin_proposal_nullish_coalescing_operator_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-proposal-nullish-coalescing-operator/-/plugin-proposal-nullish-coalescing-operator-7.8.3.tgz";
        sha1 = "e4572253fdeed65cddeecfdab3f928afeb2fd5d2";
      };
    }
    {
      name = "_babel_plugin_proposal_numeric_separator___plugin_proposal_numeric_separator_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_proposal_numeric_separator___plugin_proposal_numeric_separator_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-proposal-numeric-separator/-/plugin-proposal-numeric-separator-7.8.3.tgz";
        sha1 = "5d6769409699ec9b3b68684cd8116cedff93bad8";
      };
    }
    {
      name = "_babel_plugin_proposal_object_rest_spread___plugin_proposal_object_rest_spread_7.9.6.tgz";
      path = fetchurl {
        name = "_babel_plugin_proposal_object_rest_spread___plugin_proposal_object_rest_spread_7.9.6.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-proposal-object-rest-spread/-/plugin-proposal-object-rest-spread-7.9.6.tgz";
        sha1 = "7a093586fcb18b08266eb1a7177da671ac575b63";
      };
    }
    {
      name = "_babel_plugin_proposal_optional_catch_binding___plugin_proposal_optional_catch_binding_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_proposal_optional_catch_binding___plugin_proposal_optional_catch_binding_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-proposal-optional-catch-binding/-/plugin-proposal-optional-catch-binding-7.8.3.tgz";
        sha1 = "9dee96ab1650eed88646ae9734ca167ac4a9c5c9";
      };
    }
    {
      name = "_babel_plugin_proposal_optional_chaining___plugin_proposal_optional_chaining_7.9.0.tgz";
      path = fetchurl {
        name = "_babel_plugin_proposal_optional_chaining___plugin_proposal_optional_chaining_7.9.0.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-proposal-optional-chaining/-/plugin-proposal-optional-chaining-7.9.0.tgz";
        sha1 = "31db16b154c39d6b8a645292472b98394c292a58";
      };
    }
    {
      name = "_babel_plugin_proposal_unicode_property_regex___plugin_proposal_unicode_property_regex_7.8.8.tgz";
      path = fetchurl {
        name = "_babel_plugin_proposal_unicode_property_regex___plugin_proposal_unicode_property_regex_7.8.8.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-proposal-unicode-property-regex/-/plugin-proposal-unicode-property-regex-7.8.8.tgz";
        sha1 = "ee3a95e90cdc04fe8cd92ec3279fa017d68a0d1d";
      };
    }
    {
      name = "_babel_plugin_syntax_async_generators___plugin_syntax_async_generators_7.8.4.tgz";
      path = fetchurl {
        name = "_babel_plugin_syntax_async_generators___plugin_syntax_async_generators_7.8.4.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-syntax-async-generators/-/plugin-syntax-async-generators-7.8.4.tgz";
        sha1 = "a983fb1aeb2ec3f6ed042a210f640e90e786fe0d";
      };
    }
    {
      name = "_babel_plugin_syntax_bigint___plugin_syntax_bigint_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_syntax_bigint___plugin_syntax_bigint_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-syntax-bigint/-/plugin-syntax-bigint-7.8.3.tgz";
        sha1 = "4c9a6f669f5d0cdf1b90a1671e9a146be5300cea";
      };
    }
    {
      name = "_babel_plugin_syntax_class_properties___plugin_syntax_class_properties_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_syntax_class_properties___plugin_syntax_class_properties_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-syntax-class-properties/-/plugin-syntax-class-properties-7.8.3.tgz";
        sha1 = "6cb933a8872c8d359bfde69bbeaae5162fd1e8f7";
      };
    }
    {
      name = "_babel_plugin_syntax_dynamic_import___plugin_syntax_dynamic_import_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_syntax_dynamic_import___plugin_syntax_dynamic_import_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-syntax-dynamic-import/-/plugin-syntax-dynamic-import-7.8.3.tgz";
        sha1 = "62bf98b2da3cd21d626154fc96ee5b3cb68eacb3";
      };
    }
    {
      name = "_babel_plugin_syntax_flow___plugin_syntax_flow_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_syntax_flow___plugin_syntax_flow_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-syntax-flow/-/plugin-syntax-flow-7.8.3.tgz";
        sha1 = "f2c883bd61a6316f2c89380ae5122f923ba4527f";
      };
    }
    {
      name = "_babel_plugin_syntax_json_strings___plugin_syntax_json_strings_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_syntax_json_strings___plugin_syntax_json_strings_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-syntax-json-strings/-/plugin-syntax-json-strings-7.8.3.tgz";
        sha1 = "01ca21b668cd8218c9e640cb6dd88c5412b2c96a";
      };
    }
    {
      name = "_babel_plugin_syntax_jsx___plugin_syntax_jsx_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_syntax_jsx___plugin_syntax_jsx_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-syntax-jsx/-/plugin-syntax-jsx-7.8.3.tgz";
        sha1 = "521b06c83c40480f1e58b4fd33b92eceb1d6ea94";
      };
    }
    {
      name = "_babel_plugin_syntax_logical_assignment_operators___plugin_syntax_logical_assignment_operators_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_syntax_logical_assignment_operators___plugin_syntax_logical_assignment_operators_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-syntax-logical-assignment-operators/-/plugin-syntax-logical-assignment-operators-7.8.3.tgz";
        sha1 = "3995d7d7ffff432f6ddc742b47e730c054599897";
      };
    }
    {
      name = "_babel_plugin_syntax_nullish_coalescing_operator___plugin_syntax_nullish_coalescing_operator_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_syntax_nullish_coalescing_operator___plugin_syntax_nullish_coalescing_operator_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-syntax-nullish-coalescing-operator/-/plugin-syntax-nullish-coalescing-operator-7.8.3.tgz";
        sha1 = "167ed70368886081f74b5c36c65a88c03b66d1a9";
      };
    }
    {
      name = "_babel_plugin_syntax_numeric_separator___plugin_syntax_numeric_separator_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_syntax_numeric_separator___plugin_syntax_numeric_separator_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-syntax-numeric-separator/-/plugin-syntax-numeric-separator-7.8.3.tgz";
        sha1 = "0e3fb63e09bea1b11e96467271c8308007e7c41f";
      };
    }
    {
      name = "_babel_plugin_syntax_object_rest_spread___plugin_syntax_object_rest_spread_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_syntax_object_rest_spread___plugin_syntax_object_rest_spread_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-syntax-object-rest-spread/-/plugin-syntax-object-rest-spread-7.8.3.tgz";
        sha1 = "60e225edcbd98a640332a2e72dd3e66f1af55871";
      };
    }
    {
      name = "_babel_plugin_syntax_optional_catch_binding___plugin_syntax_optional_catch_binding_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_syntax_optional_catch_binding___plugin_syntax_optional_catch_binding_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-syntax-optional-catch-binding/-/plugin-syntax-optional-catch-binding-7.8.3.tgz";
        sha1 = "6111a265bcfb020eb9efd0fdfd7d26402b9ed6c1";
      };
    }
    {
      name = "_babel_plugin_syntax_optional_chaining___plugin_syntax_optional_chaining_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_syntax_optional_chaining___plugin_syntax_optional_chaining_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-syntax-optional-chaining/-/plugin-syntax-optional-chaining-7.8.3.tgz";
        sha1 = "4f69c2ab95167e0180cd5336613f8c5788f7d48a";
      };
    }
    {
      name = "_babel_plugin_syntax_top_level_await___plugin_syntax_top_level_await_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_syntax_top_level_await___plugin_syntax_top_level_await_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-syntax-top-level-await/-/plugin-syntax-top-level-await-7.8.3.tgz";
        sha1 = "3acdece695e6b13aaf57fc291d1a800950c71391";
      };
    }
    {
      name = "_babel_plugin_transform_arrow_functions___plugin_transform_arrow_functions_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_arrow_functions___plugin_transform_arrow_functions_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-arrow-functions/-/plugin-transform-arrow-functions-7.8.3.tgz";
        sha1 = "82776c2ed0cd9e1a49956daeb896024c9473b8b6";
      };
    }
    {
      name = "_babel_plugin_transform_async_to_generator___plugin_transform_async_to_generator_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_async_to_generator___plugin_transform_async_to_generator_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-async-to-generator/-/plugin-transform-async-to-generator-7.8.3.tgz";
        sha1 = "4308fad0d9409d71eafb9b1a6ee35f9d64b64086";
      };
    }
    {
      name = "_babel_plugin_transform_block_scoped_functions___plugin_transform_block_scoped_functions_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_block_scoped_functions___plugin_transform_block_scoped_functions_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-block-scoped-functions/-/plugin-transform-block-scoped-functions-7.8.3.tgz";
        sha1 = "437eec5b799b5852072084b3ae5ef66e8349e8a3";
      };
    }
    {
      name = "_babel_plugin_transform_block_scoping___plugin_transform_block_scoping_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_block_scoping___plugin_transform_block_scoping_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-block-scoping/-/plugin-transform-block-scoping-7.8.3.tgz";
        sha1 = "97d35dab66857a437c166358b91d09050c868f3a";
      };
    }
    {
      name = "_babel_plugin_transform_classes___plugin_transform_classes_7.9.5.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_classes___plugin_transform_classes_7.9.5.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-classes/-/plugin-transform-classes-7.9.5.tgz";
        sha1 = "800597ddb8aefc2c293ed27459c1fcc935a26c2c";
      };
    }
    {
      name = "_babel_plugin_transform_computed_properties___plugin_transform_computed_properties_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_computed_properties___plugin_transform_computed_properties_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-computed-properties/-/plugin-transform-computed-properties-7.8.3.tgz";
        sha1 = "96d0d28b7f7ce4eb5b120bb2e0e943343c86f81b";
      };
    }
    {
      name = "_babel_plugin_transform_destructuring___plugin_transform_destructuring_7.9.5.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_destructuring___plugin_transform_destructuring_7.9.5.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-destructuring/-/plugin-transform-destructuring-7.9.5.tgz";
        sha1 = "72c97cf5f38604aea3abf3b935b0e17b1db76a50";
      };
    }
    {
      name = "_babel_plugin_transform_dotall_regex___plugin_transform_dotall_regex_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_dotall_regex___plugin_transform_dotall_regex_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-dotall-regex/-/plugin-transform-dotall-regex-7.8.3.tgz";
        sha1 = "c3c6ec5ee6125c6993c5cbca20dc8621a9ea7a6e";
      };
    }
    {
      name = "_babel_plugin_transform_duplicate_keys___plugin_transform_duplicate_keys_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_duplicate_keys___plugin_transform_duplicate_keys_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-duplicate-keys/-/plugin-transform-duplicate-keys-7.8.3.tgz";
        sha1 = "8d12df309aa537f272899c565ea1768e286e21f1";
      };
    }
    {
      name = "_babel_plugin_transform_exponentiation_operator___plugin_transform_exponentiation_operator_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_exponentiation_operator___plugin_transform_exponentiation_operator_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-exponentiation-operator/-/plugin-transform-exponentiation-operator-7.8.3.tgz";
        sha1 = "581a6d7f56970e06bf51560cd64f5e947b70d7b7";
      };
    }
    {
      name = "_babel_plugin_transform_flow_strip_types___plugin_transform_flow_strip_types_7.3.4.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_flow_strip_types___plugin_transform_flow_strip_types_7.3.4.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-flow-strip-types/-/plugin-transform-flow-strip-types-7.3.4.tgz";
        sha1 = "00156236defb7dedddc2d3c9477dcc01a4494327";
      };
    }
    {
      name = "_babel_plugin_transform_flow_strip_types___plugin_transform_flow_strip_types_7.9.0.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_flow_strip_types___plugin_transform_flow_strip_types_7.9.0.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-flow-strip-types/-/plugin-transform-flow-strip-types-7.9.0.tgz";
        sha1 = "8a3538aa40434e000b8f44a3c5c9ac7229bd2392";
      };
    }
    {
      name = "_babel_plugin_transform_for_of___plugin_transform_for_of_7.9.0.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_for_of___plugin_transform_for_of_7.9.0.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-for-of/-/plugin-transform-for-of-7.9.0.tgz";
        sha1 = "0f260e27d3e29cd1bb3128da5e76c761aa6c108e";
      };
    }
    {
      name = "_babel_plugin_transform_function_name___plugin_transform_function_name_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_function_name___plugin_transform_function_name_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-function-name/-/plugin-transform-function-name-7.8.3.tgz";
        sha1 = "279373cb27322aaad67c2683e776dfc47196ed8b";
      };
    }
    {
      name = "_babel_plugin_transform_literals___plugin_transform_literals_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_literals___plugin_transform_literals_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-literals/-/plugin-transform-literals-7.8.3.tgz";
        sha1 = "aef239823d91994ec7b68e55193525d76dbd5dc1";
      };
    }
    {
      name = "_babel_plugin_transform_member_expression_literals___plugin_transform_member_expression_literals_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_member_expression_literals___plugin_transform_member_expression_literals_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-member-expression-literals/-/plugin-transform-member-expression-literals-7.8.3.tgz";
        sha1 = "963fed4b620ac7cbf6029c755424029fa3a40410";
      };
    }
    {
      name = "_babel_plugin_transform_modules_amd___plugin_transform_modules_amd_7.9.6.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_modules_amd___plugin_transform_modules_amd_7.9.6.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-modules-amd/-/plugin-transform-modules-amd-7.9.6.tgz";
        sha1 = "8539ec42c153d12ea3836e0e3ac30d5aae7b258e";
      };
    }
    {
      name = "_babel_plugin_transform_modules_commonjs___plugin_transform_modules_commonjs_7.2.0.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_modules_commonjs___plugin_transform_modules_commonjs_7.2.0.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-modules-commonjs/-/plugin-transform-modules-commonjs-7.2.0.tgz";
        sha1 = "c4f1933f5991d5145e9cfad1dfd848ea1727f404";
      };
    }
    {
      name = "_babel_plugin_transform_modules_commonjs___plugin_transform_modules_commonjs_7.9.6.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_modules_commonjs___plugin_transform_modules_commonjs_7.9.6.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-modules-commonjs/-/plugin-transform-modules-commonjs-7.9.6.tgz";
        sha1 = "64b7474a4279ee588cacd1906695ca721687c277";
      };
    }
    {
      name = "_babel_plugin_transform_modules_systemjs___plugin_transform_modules_systemjs_7.9.6.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_modules_systemjs___plugin_transform_modules_systemjs_7.9.6.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-modules-systemjs/-/plugin-transform-modules-systemjs-7.9.6.tgz";
        sha1 = "207f1461c78a231d5337a92140e52422510d81a4";
      };
    }
    {
      name = "_babel_plugin_transform_modules_umd___plugin_transform_modules_umd_7.9.0.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_modules_umd___plugin_transform_modules_umd_7.9.0.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-modules-umd/-/plugin-transform-modules-umd-7.9.0.tgz";
        sha1 = "e909acae276fec280f9b821a5f38e1f08b480697";
      };
    }
    {
      name = "_babel_plugin_transform_named_capturing_groups_regex___plugin_transform_named_capturing_groups_regex_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_named_capturing_groups_regex___plugin_transform_named_capturing_groups_regex_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-named-capturing-groups-regex/-/plugin-transform-named-capturing-groups-regex-7.8.3.tgz";
        sha1 = "a2a72bffa202ac0e2d0506afd0939c5ecbc48c6c";
      };
    }
    {
      name = "_babel_plugin_transform_new_target___plugin_transform_new_target_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_new_target___plugin_transform_new_target_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-new-target/-/plugin-transform-new-target-7.8.3.tgz";
        sha1 = "60cc2ae66d85c95ab540eb34babb6434d4c70c43";
      };
    }
    {
      name = "_babel_plugin_transform_object_super___plugin_transform_object_super_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_object_super___plugin_transform_object_super_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-object-super/-/plugin-transform-object-super-7.8.3.tgz";
        sha1 = "ebb6a1e7a86ffa96858bd6ac0102d65944261725";
      };
    }
    {
      name = "_babel_plugin_transform_parameters___plugin_transform_parameters_7.9.5.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_parameters___plugin_transform_parameters_7.9.5.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-parameters/-/plugin-transform-parameters-7.9.5.tgz";
        sha1 = "173b265746f5e15b2afe527eeda65b73623a0795";
      };
    }
    {
      name = "_babel_plugin_transform_property_literals___plugin_transform_property_literals_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_property_literals___plugin_transform_property_literals_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-property-literals/-/plugin-transform-property-literals-7.8.3.tgz";
        sha1 = "33194300d8539c1ed28c62ad5087ba3807b98263";
      };
    }
    {
      name = "_babel_plugin_transform_react_jsx___plugin_transform_react_jsx_7.9.4.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_react_jsx___plugin_transform_react_jsx_7.9.4.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-react-jsx/-/plugin-transform-react-jsx-7.9.4.tgz";
        sha1 = "86f576c8540bd06d0e95e0b61ea76d55f6cbd03f";
      };
    }
    {
      name = "_babel_plugin_transform_react_jsx___plugin_transform_react_jsx_7.3.0.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_react_jsx___plugin_transform_react_jsx_7.3.0.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-react-jsx/-/plugin-transform-react-jsx-7.3.0.tgz";
        sha1 = "f2cab99026631c767e2745a5368b331cfe8f5290";
      };
    }
    {
      name = "_babel_plugin_transform_regenerator___plugin_transform_regenerator_7.8.7.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_regenerator___plugin_transform_regenerator_7.8.7.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-regenerator/-/plugin-transform-regenerator-7.8.7.tgz";
        sha1 = "5e46a0dca2bee1ad8285eb0527e6abc9c37672f8";
      };
    }
    {
      name = "_babel_plugin_transform_reserved_words___plugin_transform_reserved_words_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_reserved_words___plugin_transform_reserved_words_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-reserved-words/-/plugin-transform-reserved-words-7.8.3.tgz";
        sha1 = "9a0635ac4e665d29b162837dd3cc50745dfdf1f5";
      };
    }
    {
      name = "_babel_plugin_transform_shorthand_properties___plugin_transform_shorthand_properties_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_shorthand_properties___plugin_transform_shorthand_properties_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-shorthand-properties/-/plugin-transform-shorthand-properties-7.8.3.tgz";
        sha1 = "28545216e023a832d4d3a1185ed492bcfeac08c8";
      };
    }
    {
      name = "_babel_plugin_transform_spread___plugin_transform_spread_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_spread___plugin_transform_spread_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-spread/-/plugin-transform-spread-7.8.3.tgz";
        sha1 = "9c8ffe8170fdfb88b114ecb920b82fb6e95fe5e8";
      };
    }
    {
      name = "_babel_plugin_transform_sticky_regex___plugin_transform_sticky_regex_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_sticky_regex___plugin_transform_sticky_regex_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-sticky-regex/-/plugin-transform-sticky-regex-7.8.3.tgz";
        sha1 = "be7a1290f81dae767475452199e1f76d6175b100";
      };
    }
    {
      name = "_babel_plugin_transform_template_literals___plugin_transform_template_literals_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_template_literals___plugin_transform_template_literals_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-template-literals/-/plugin-transform-template-literals-7.8.3.tgz";
        sha1 = "7bfa4732b455ea6a43130adc0ba767ec0e402a80";
      };
    }
    {
      name = "_babel_plugin_transform_typeof_symbol___plugin_transform_typeof_symbol_7.8.4.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_typeof_symbol___plugin_transform_typeof_symbol_7.8.4.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-typeof-symbol/-/plugin-transform-typeof-symbol-7.8.4.tgz";
        sha1 = "ede4062315ce0aaf8a657a920858f1a2f35fc412";
      };
    }
    {
      name = "_babel_plugin_transform_unicode_regex___plugin_transform_unicode_regex_7.8.3.tgz";
      path = fetchurl {
        name = "_babel_plugin_transform_unicode_regex___plugin_transform_unicode_regex_7.8.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/plugin-transform-unicode-regex/-/plugin-transform-unicode-regex-7.8.3.tgz";
        sha1 = "0cef36e3ba73e5c57273effb182f46b91a1ecaad";
      };
    }
    {
      name = "_babel_preset_env___preset_env_7.3.4.tgz";
      path = fetchurl {
        name = "_babel_preset_env___preset_env_7.3.4.tgz";
        url  = "https://registry.yarnpkg.com/@babel/preset-env/-/preset-env-7.3.4.tgz";
        sha1 = "887cf38b6d23c82f19b5135298bdb160062e33e1";
      };
    }
    {
      name = "_babel_preset_env___preset_env_7.9.6.tgz";
      path = fetchurl {
        name = "_babel_preset_env___preset_env_7.9.6.tgz";
        url  = "https://registry.yarnpkg.com/@babel/preset-env/-/preset-env-7.9.6.tgz";
        sha1 = "df063b276c6455ec6fcfc6e53aacc38da9b0aea6";
      };
    }
    {
      name = "_babel_preset_modules___preset_modules_0.1.3.tgz";
      path = fetchurl {
        name = "_babel_preset_modules___preset_modules_0.1.3.tgz";
        url  = "https://registry.yarnpkg.com/@babel/preset-modules/-/preset-modules-0.1.3.tgz";
        sha1 = "13242b53b5ef8c883c3cf7dddd55b36ce80fbc72";
      };
    }
    {
      name = "_babel_runtime___runtime_7.3.4.tgz";
      path = fetchurl {
        name = "_babel_runtime___runtime_7.3.4.tgz";
        url  = "https://registry.yarnpkg.com/@babel/runtime/-/runtime-7.3.4.tgz";
        sha1 = "73d12ba819e365fcf7fd152aed56d6df97d21c83";
      };
    }
    {
      name = "_babel_runtime___runtime_7.9.6.tgz";
      path = fetchurl {
        name = "_babel_runtime___runtime_7.9.6.tgz";
        url  = "https://registry.yarnpkg.com/@babel/runtime/-/runtime-7.9.6.tgz";
        sha1 = "a9102eb5cadedf3f31d08a9ecf294af7827ea29f";
      };
    }
    {
      name = "_babel_template___template_7.2.2.tgz";
      path = fetchurl {
        name = "_babel_template___template_7.2.2.tgz";
        url  = "https://registry.yarnpkg.com/@babel/template/-/template-7.2.2.tgz";
        sha1 = "005b3fdf0ed96e88041330379e0da9a708eb2907";
      };
    }
    {
      name = "_babel_template___template_7.8.6.tgz";
      path = fetchurl {
        name = "_babel_template___template_7.8.6.tgz";
        url  = "https://registry.yarnpkg.com/@babel/template/-/template-7.8.6.tgz";
        sha1 = "86b22af15f828dfb086474f964dcc3e39c43ce2b";
      };
    }
    {
      name = "_babel_traverse___traverse_7.3.4.tgz";
      path = fetchurl {
        name = "_babel_traverse___traverse_7.3.4.tgz";
        url  = "https://registry.yarnpkg.com/@babel/traverse/-/traverse-7.3.4.tgz";
        sha1 = "1330aab72234f8dea091b08c4f8b9d05c7119e06";
      };
    }
    {
      name = "_babel_traverse___traverse_7.9.6.tgz";
      path = fetchurl {
        name = "_babel_traverse___traverse_7.9.6.tgz";
        url  = "https://registry.yarnpkg.com/@babel/traverse/-/traverse-7.9.6.tgz";
        sha1 = "5540d7577697bf619cc57b92aa0f1c231a94f442";
      };
    }
    {
      name = "_babel_types___types_7.9.6.tgz";
      path = fetchurl {
        name = "_babel_types___types_7.9.6.tgz";
        url  = "https://registry.yarnpkg.com/@babel/types/-/types-7.9.6.tgz";
        sha1 = "2c5502b427251e9de1bd2dff95add646d95cc9f7";
      };
    }
    {
      name = "_babel_types___types_7.3.4.tgz";
      path = fetchurl {
        name = "_babel_types___types_7.3.4.tgz";
        url  = "https://registry.yarnpkg.com/@babel/types/-/types-7.3.4.tgz";
        sha1 = "bf482eaeaffb367a28abbf9357a94963235d90ed";
      };
    }
    {
      name = "_bcoe_v8_coverage___v8_coverage_0.2.3.tgz";
      path = fetchurl {
        name = "_bcoe_v8_coverage___v8_coverage_0.2.3.tgz";
        url  = "https://registry.yarnpkg.com/@bcoe/v8-coverage/-/v8-coverage-0.2.3.tgz";
        sha1 = "75a2e8b51cb758a7553d6804a5932d7aace75c39";
      };
    }
    {
      name = "_cnakazawa_watch___watch_1.0.4.tgz";
      path = fetchurl {
        name = "_cnakazawa_watch___watch_1.0.4.tgz";
        url  = "https://registry.yarnpkg.com/@cnakazawa/watch/-/watch-1.0.4.tgz";
        sha1 = "f864ae85004d0fcab6f50be9141c4da368d1656a";
      };
    }
    {
      name = "_emotion_cache___cache_10.0.29.tgz";
      path = fetchurl {
        name = "_emotion_cache___cache_10.0.29.tgz";
        url  = "https://registry.yarnpkg.com/@emotion/cache/-/cache-10.0.29.tgz";
        sha1 = "87e7e64f412c060102d589fe7c6dc042e6f9d1e0";
      };
    }
    {
      name = "_emotion_hash___hash_0.8.0.tgz";
      path = fetchurl {
        name = "_emotion_hash___hash_0.8.0.tgz";
        url  = "https://registry.yarnpkg.com/@emotion/hash/-/hash-0.8.0.tgz";
        sha1 = "bbbff68978fefdbe68ccb533bc8cbe1d1afb5413";
      };
    }
    {
      name = "_emotion_memoize___memoize_0.7.4.tgz";
      path = fetchurl {
        name = "_emotion_memoize___memoize_0.7.4.tgz";
        url  = "https://registry.yarnpkg.com/@emotion/memoize/-/memoize-0.7.4.tgz";
        sha1 = "19bf0f5af19149111c40d98bb0cf82119f5d9eeb";
      };
    }
    {
      name = "_emotion_serialize___serialize_0.11.16.tgz";
      path = fetchurl {
        name = "_emotion_serialize___serialize_0.11.16.tgz";
        url  = "https://registry.yarnpkg.com/@emotion/serialize/-/serialize-0.11.16.tgz";
        sha1 = "dee05f9e96ad2fb25a5206b6d759b2d1ed3379ad";
      };
    }
    {
      name = "_emotion_sheet___sheet_0.9.4.tgz";
      path = fetchurl {
        name = "_emotion_sheet___sheet_0.9.4.tgz";
        url  = "https://registry.yarnpkg.com/@emotion/sheet/-/sheet-0.9.4.tgz";
        sha1 = "894374bea39ec30f489bbfc3438192b9774d32e5";
      };
    }
    {
      name = "_emotion_stylis___stylis_0.8.5.tgz";
      path = fetchurl {
        name = "_emotion_stylis___stylis_0.8.5.tgz";
        url  = "https://registry.yarnpkg.com/@emotion/stylis/-/stylis-0.8.5.tgz";
        sha1 = "deacb389bd6ee77d1e7fcaccce9e16c5c7e78e04";
      };
    }
    {
      name = "_emotion_unitless___unitless_0.7.5.tgz";
      path = fetchurl {
        name = "_emotion_unitless___unitless_0.7.5.tgz";
        url  = "https://registry.yarnpkg.com/@emotion/unitless/-/unitless-0.7.5.tgz";
        sha1 = "77211291c1900a700b8a78cfafda3160d76949ed";
      };
    }
    {
      name = "_emotion_utils___utils_0.11.3.tgz";
      path = fetchurl {
        name = "_emotion_utils___utils_0.11.3.tgz";
        url  = "https://registry.yarnpkg.com/@emotion/utils/-/utils-0.11.3.tgz";
        sha1 = "a759863867befa7e583400d322652a3f44820924";
      };
    }
    {
      name = "_emotion_weak_memoize___weak_memoize_0.2.5.tgz";
      path = fetchurl {
        name = "_emotion_weak_memoize___weak_memoize_0.2.5.tgz";
        url  = "https://registry.yarnpkg.com/@emotion/weak-memoize/-/weak-memoize-0.2.5.tgz";
        sha1 = "8eed982e2ee6f7f4e44c253e12962980791efd46";
      };
    }
    {
      name = "_foretold_cdf___cdf_1.0.16.tgz";
      path = fetchurl {
        name = "_foretold_cdf___cdf_1.0.16.tgz";
        url  = "https://registry.yarnpkg.com/@foretold/cdf/-/cdf-1.0.16.tgz";
        sha1 = "19046f9d67b134052de76c72fb35f989ac766b82";
      };
    }

    {
      name = "_foretold_guesstimator___guesstimator_1.0.11.tgz";
      path = fetchurl {
        name = "_foretold_guesstimator___guesstimator_1.0.11.tgz";
        url  = "https://registry.yarnpkg.com/@foretold/guesstimator/-/guesstimator-1.0.11.tgz";
        sha1 = "9855a5bea1e0e6c14d8266f92648252073b787cf";
      };
    }
    {
      name = "_glennsl_bs_jest___bs_jest_0.5.1.tgz";
      path = fetchurl {
        name = "_glennsl_bs_jest___bs_jest_0.5.1.tgz";
        url  = "https://registry.yarnpkg.com/@glennsl/bs-jest/-/bs-jest-0.5.1.tgz";
        sha1 = "2e16ad94268fc1e5ba0af978c141db1684556a55";
      };
    }
    {
      name = "_glennsl_bs_json___bs_json_5.0.2.tgz";
      path = fetchurl {
        name = "_glennsl_bs_json___bs_json_5.0.2.tgz";
        url  = "https://registry.yarnpkg.com/@glennsl/bs-json/-/bs-json-5.0.2.tgz";
        sha1 = "cfb85d94d370ec6dc17849e0ddb1a51eee08cfcc";
      };
    }
    {
      name = "_iarna_toml___toml_2.2.5.tgz";
      path = fetchurl {
        name = "_iarna_toml___toml_2.2.5.tgz";
        url  = "https://registry.yarnpkg.com/@iarna/toml/-/toml-2.2.5.tgz";
        sha1 = "b32366c89b43c6f8cefbdefac778b9c828e3ba8c";
      };
    }
    {
      name = "_istanbuljs_load_nyc_config___load_nyc_config_1.0.0.tgz";
      path = fetchurl {
        name = "_istanbuljs_load_nyc_config___load_nyc_config_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/@istanbuljs/load-nyc-config/-/load-nyc-config-1.0.0.tgz";
        sha1 = "10602de5570baea82f8afbfa2630b24e7a8cfe5b";
      };
    }
    {
      name = "_istanbuljs_schema___schema_0.1.2.tgz";
      path = fetchurl {
        name = "_istanbuljs_schema___schema_0.1.2.tgz";
        url  = "https://registry.yarnpkg.com/@istanbuljs/schema/-/schema-0.1.2.tgz";
        sha1 = "26520bf09abe4a5644cd5414e37125a8954241dd";
      };
    }
    {
      name = "_jest_console___console_25.5.0.tgz";
      path = fetchurl {
        name = "_jest_console___console_25.5.0.tgz";
        url  = "https://registry.yarnpkg.com/@jest/console/-/console-25.5.0.tgz";
        sha1 = "770800799d510f37329c508a9edd0b7b447d9abb";
      };
    }
    {
      name = "_jest_core___core_25.5.2.tgz";
      path = fetchurl {
        name = "_jest_core___core_25.5.2.tgz";
        url  = "https://registry.yarnpkg.com/@jest/core/-/core-25.5.2.tgz";
        sha1 = "d3f49782ad5c09478214ddd45249e5b7663a0328";
      };
    }
    {
      name = "_jest_environment___environment_25.5.0.tgz";
      path = fetchurl {
        name = "_jest_environment___environment_25.5.0.tgz";
        url  = "https://registry.yarnpkg.com/@jest/environment/-/environment-25.5.0.tgz";
        sha1 = "aa33b0c21a716c65686638e7ef816c0e3a0c7b37";
      };
    }
    {
      name = "_jest_fake_timers___fake_timers_25.5.0.tgz";
      path = fetchurl {
        name = "_jest_fake_timers___fake_timers_25.5.0.tgz";
        url  = "https://registry.yarnpkg.com/@jest/fake-timers/-/fake-timers-25.5.0.tgz";
        sha1 = "46352e00533c024c90c2bc2ad9f2959f7f114185";
      };
    }
    {
      name = "_jest_globals___globals_25.5.2.tgz";
      path = fetchurl {
        name = "_jest_globals___globals_25.5.2.tgz";
        url  = "https://registry.yarnpkg.com/@jest/globals/-/globals-25.5.2.tgz";
        sha1 = "5e45e9de8d228716af3257eeb3991cc2e162ca88";
      };
    }
    {
      name = "_jest_reporters___reporters_25.5.1.tgz";
      path = fetchurl {
        name = "_jest_reporters___reporters_25.5.1.tgz";
        url  = "https://registry.yarnpkg.com/@jest/reporters/-/reporters-25.5.1.tgz";
        sha1 = "cb686bcc680f664c2dbaf7ed873e93aa6811538b";
      };
    }
    {
      name = "_jest_source_map___source_map_25.5.0.tgz";
      path = fetchurl {
        name = "_jest_source_map___source_map_25.5.0.tgz";
        url  = "https://registry.yarnpkg.com/@jest/source-map/-/source-map-25.5.0.tgz";
        sha1 = "df5c20d6050aa292c2c6d3f0d2c7606af315bd1b";
      };
    }
    {
      name = "_jest_test_result___test_result_25.5.0.tgz";
      path = fetchurl {
        name = "_jest_test_result___test_result_25.5.0.tgz";
        url  = "https://registry.yarnpkg.com/@jest/test-result/-/test-result-25.5.0.tgz";
        sha1 = "139a043230cdeffe9ba2d8341b27f2efc77ce87c";
      };
    }
    {
      name = "_jest_test_sequencer___test_sequencer_25.5.2.tgz";
      path = fetchurl {
        name = "_jest_test_sequencer___test_sequencer_25.5.2.tgz";
        url  = "https://registry.yarnpkg.com/@jest/test-sequencer/-/test-sequencer-25.5.2.tgz";
        sha1 = "3d291179de020f42835469fff1de496d6309848a";
      };
    }
    {
      name = "_jest_transform___transform_25.5.1.tgz";
      path = fetchurl {
        name = "_jest_transform___transform_25.5.1.tgz";
        url  = "https://registry.yarnpkg.com/@jest/transform/-/transform-25.5.1.tgz";
        sha1 = "0469ddc17699dd2bf985db55fa0fb9309f5c2db3";
      };
    }
    {
      name = "_jest_types___types_25.5.0.tgz";
      path = fetchurl {
        name = "_jest_types___types_25.5.0.tgz";
        url  = "https://registry.yarnpkg.com/@jest/types/-/types-25.5.0.tgz";
        sha1 = "4d6a4793f7b9599fc3680877b856a97dbccf2a9d";
      };
    }
    {
      name = "_mrmlnc_readdir_enhanced___readdir_enhanced_2.2.1.tgz";
      path = fetchurl {
        name = "_mrmlnc_readdir_enhanced___readdir_enhanced_2.2.1.tgz";
        url  = "https://registry.yarnpkg.com/@mrmlnc/readdir-enhanced/-/readdir-enhanced-2.2.1.tgz";
        sha1 = "524af240d1a360527b730475ecfa1344aa540dde";
      };
    }
    {
      name = "_nodelib_fs.scandir___fs.scandir_2.1.3.tgz";
      path = fetchurl {
        name = "_nodelib_fs.scandir___fs.scandir_2.1.3.tgz";
        url  = "https://registry.yarnpkg.com/@nodelib/fs.scandir/-/fs.scandir-2.1.3.tgz";
        sha1 = "3a582bdb53804c6ba6d146579c46e52130cf4a3b";
      };
    }
    {
      name = "_nodelib_fs.stat___fs.stat_2.0.3.tgz";
      path = fetchurl {
        name = "_nodelib_fs.stat___fs.stat_2.0.3.tgz";
        url  = "https://registry.yarnpkg.com/@nodelib/fs.stat/-/fs.stat-2.0.3.tgz";
        sha1 = "34dc5f4cabbc720f4e60f75a747e7ecd6c175bd3";
      };
    }
    {
      name = "_nodelib_fs.stat___fs.stat_1.1.3.tgz";
      path = fetchurl {
        name = "_nodelib_fs.stat___fs.stat_1.1.3.tgz";
        url  = "https://registry.yarnpkg.com/@nodelib/fs.stat/-/fs.stat-1.1.3.tgz";
        sha1 = "2b5a3ab3f918cca48a8c754c08168e3f03eba61b";
      };
    }
    {
      name = "_nodelib_fs.walk___fs.walk_1.2.4.tgz";
      path = fetchurl {
        name = "_nodelib_fs.walk___fs.walk_1.2.4.tgz";
        url  = "https://registry.yarnpkg.com/@nodelib/fs.walk/-/fs.walk-1.2.4.tgz";
        sha1 = "011b9202a70a6366e436ca5c065844528ab04976";
      };
    }
    {
      name = "_parcel_fs___fs_1.11.0.tgz";
      path = fetchurl {
        name = "_parcel_fs___fs_1.11.0.tgz";
        url  = "https://registry.yarnpkg.com/@parcel/fs/-/fs-1.11.0.tgz";
        sha1 = "fb8a2be038c454ad46a50dc0554c1805f13535cd";
      };
    }
    {
      name = "_parcel_logger___logger_1.11.1.tgz";
      path = fetchurl {
        name = "_parcel_logger___logger_1.11.1.tgz";
        url  = "https://registry.yarnpkg.com/@parcel/logger/-/logger-1.11.1.tgz";
        sha1 = "c55b0744bcbe84ebc291155627f0ec406a23e2e6";
      };
    }
    {
      name = "_parcel_utils___utils_1.11.0.tgz";
      path = fetchurl {
        name = "_parcel_utils___utils_1.11.0.tgz";
        url  = "https://registry.yarnpkg.com/@parcel/utils/-/utils-1.11.0.tgz";
        sha1 = "539e08fff8af3b26eca11302be80b522674b51ea";
      };
    }
    {
      name = "_parcel_watcher___watcher_1.12.1.tgz";
      path = fetchurl {
        name = "_parcel_watcher___watcher_1.12.1.tgz";
        url  = "https://registry.yarnpkg.com/@parcel/watcher/-/watcher-1.12.1.tgz";
        sha1 = "b98b3df309fcab93451b5583fc38e40826696dad";
      };
    }
    {
      name = "_parcel_workers___workers_1.11.0.tgz";
      path = fetchurl {
        name = "_parcel_workers___workers_1.11.0.tgz";
        url  = "https://registry.yarnpkg.com/@parcel/workers/-/workers-1.11.0.tgz";
        sha1 = "7b8dcf992806f4ad2b6cecf629839c41c2336c59";
      };
    }
    {
      name = "_rescript_react___react_0.10.3.tgz";
      path = fetchurl {
        name = "_rescript_react___react_0.10.3.tgz";
        url  = "https://registry.yarnpkg.com/@rescript/react/-/react-0.10.3.tgz";
        sha1 = "a2a8bed6b017940ec26c2154764b350f50348889";
      };
    }
    {
      name = "_sinonjs_commons___commons_1.7.2.tgz";
      path = fetchurl {
        name = "_sinonjs_commons___commons_1.7.2.tgz";
        url  = "https://registry.yarnpkg.com/@sinonjs/commons/-/commons-1.7.2.tgz";
        sha1 = "505f55c74e0272b43f6c52d81946bed7058fc0e2";
      };
    }
    {
      name = "_types_babel__core___babel__core_7.1.7.tgz";
      path = fetchurl {
        name = "_types_babel__core___babel__core_7.1.7.tgz";
        url  = "https://registry.yarnpkg.com/@types/babel__core/-/babel__core-7.1.7.tgz";
        sha1 = "1dacad8840364a57c98d0dd4855c6dd3752c6b89";
      };
    }
    {
      name = "_types_babel__generator___babel__generator_7.6.1.tgz";
      path = fetchurl {
        name = "_types_babel__generator___babel__generator_7.6.1.tgz";
        url  = "https://registry.yarnpkg.com/@types/babel__generator/-/babel__generator-7.6.1.tgz";
        sha1 = "4901767b397e8711aeb99df8d396d7ba7b7f0e04";
      };
    }
    {
      name = "_types_babel__template___babel__template_7.0.2.tgz";
      path = fetchurl {
        name = "_types_babel__template___babel__template_7.0.2.tgz";
        url  = "https://registry.yarnpkg.com/@types/babel__template/-/babel__template-7.0.2.tgz";
        sha1 = "4ff63d6b52eddac1de7b975a5223ed32ecea9307";
      };
    }
    {
      name = "_types_babel__traverse___babel__traverse_7.0.11.tgz";
      path = fetchurl {
        name = "_types_babel__traverse___babel__traverse_7.0.11.tgz";
        url  = "https://registry.yarnpkg.com/@types/babel__traverse/-/babel__traverse-7.0.11.tgz";
        sha1 = "1ae3010e8bf8851d324878b42acec71986486d18";
      };
    }
    {
      name = "_types_clone___clone_2.1.0.tgz";
      path = fetchurl {
        name = "_types_clone___clone_2.1.0.tgz";
        url  = "https://registry.yarnpkg.com/@types/clone/-/clone-2.1.0.tgz";
        sha1 = "cb888a3fe5319275b566ae3a9bc606e310c533d4";
      };
    }
    {
      name = "_types_color_name___color_name_1.1.1.tgz";
      path = fetchurl {
        name = "_types_color_name___color_name_1.1.1.tgz";
        url  = "https://registry.yarnpkg.com/@types/color-name/-/color-name-1.1.1.tgz";
        sha1 = "1c1261bbeaa10a8055bbc5d8ab84b7b2afc846a0";
      };
    }
    {
      name = "_types_events___events_3.0.0.tgz";
      path = fetchurl {
        name = "_types_events___events_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/@types/events/-/events-3.0.0.tgz";
        sha1 = "2862f3f58a9a7f7c3e78d79f130dd4d71c25c2a7";
      };
    }
    {
      name = "_types_fast_json_stable_stringify___fast_json_stable_stringify_2.0.0.tgz";
      path = fetchurl {
        name = "_types_fast_json_stable_stringify___fast_json_stable_stringify_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/@types/fast-json-stable-stringify/-/fast-json-stable-stringify-2.0.0.tgz";
        sha1 = "40363bb847cb86b2c2e1599f1398d11e8329c921";
      };
    }
    {
      name = "_types_glob___glob_7.1.1.tgz";
      path = fetchurl {
        name = "_types_glob___glob_7.1.1.tgz";
        url  = "https://registry.yarnpkg.com/@types/glob/-/glob-7.1.1.tgz";
        sha1 = "aa59a1c6e3fbc421e07ccd31a944c30eba521575";
      };
    }
    {
      name = "_types_graceful_fs___graceful_fs_4.1.3.tgz";
      path = fetchurl {
        name = "_types_graceful_fs___graceful_fs_4.1.3.tgz";
        url  = "https://registry.yarnpkg.com/@types/graceful-fs/-/graceful-fs-4.1.3.tgz";
        sha1 = "039af35fe26bec35003e8d86d2ee9c586354348f";
      };
    }
    {
      name = "_types_hoist_non_react_statics___hoist_non_react_statics_3.3.1.tgz";
      path = fetchurl {
        name = "_types_hoist_non_react_statics___hoist_non_react_statics_3.3.1.tgz";
        url  = "https://registry.yarnpkg.com/@types/hoist-non-react-statics/-/hoist-non-react-statics-3.3.1.tgz";
        sha1 = "1124aafe5118cb591977aeb1ceaaed1070eb039f";
      };
    }
    {
      name = "_types_istanbul_lib_coverage___istanbul_lib_coverage_2.0.1.tgz";
      path = fetchurl {
        name = "_types_istanbul_lib_coverage___istanbul_lib_coverage_2.0.1.tgz";
        url  = "https://registry.yarnpkg.com/@types/istanbul-lib-coverage/-/istanbul-lib-coverage-2.0.1.tgz";
        sha1 = "42995b446db9a48a11a07ec083499a860e9138ff";
      };
    }
    {
      name = "_types_istanbul_lib_report___istanbul_lib_report_3.0.0.tgz";
      path = fetchurl {
        name = "_types_istanbul_lib_report___istanbul_lib_report_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/@types/istanbul-lib-report/-/istanbul-lib-report-3.0.0.tgz";
        sha1 = "c14c24f18ea8190c118ee7562b7ff99a36552686";
      };
    }
    {
      name = "_types_istanbul_reports___istanbul_reports_1.1.1.tgz";
      path = fetchurl {
        name = "_types_istanbul_reports___istanbul_reports_1.1.1.tgz";
        url  = "https://registry.yarnpkg.com/@types/istanbul-reports/-/istanbul-reports-1.1.1.tgz";
        sha1 = "7a8cbf6a406f36c8add871625b278eaf0b0d255a";
      };
    }
    {
      name = "_types_js_cookie___js_cookie_2.2.5.tgz";
      path = fetchurl {
        name = "_types_js_cookie___js_cookie_2.2.5.tgz";
        url  = "https://registry.yarnpkg.com/@types/js-cookie/-/js-cookie-2.2.5.tgz";
        sha1 = "38dfaacae8623b37cc0b0d27398e574e3fc28b1e";
      };
    }
    {
      name = "_types_js_cookie___js_cookie_2.2.6.tgz";
      path = fetchurl {
        name = "_types_js_cookie___js_cookie_2.2.6.tgz";
        url  = "https://registry.yarnpkg.com/@types/js-cookie/-/js-cookie-2.2.6.tgz";
        sha1 = "f1a1cb35aff47bc5cfb05cb0c441ca91e914c26f";
      };
    }
    {
      name = "_types_minimatch___minimatch_3.0.3.tgz";
      path = fetchurl {
        name = "_types_minimatch___minimatch_3.0.3.tgz";
        url  = "https://registry.yarnpkg.com/@types/minimatch/-/minimatch-3.0.3.tgz";
        sha1 = "3dca0e3f33b200fc7d1139c0cd96c1268cadfd9d";
      };
    }
    {
      name = "_types_node___node_13.13.4.tgz";
      path = fetchurl {
        name = "_types_node___node_13.13.4.tgz";
        url  = "https://registry.yarnpkg.com/@types/node/-/node-13.13.4.tgz";
        sha1 = "1581d6c16e3d4803eb079c87d4ac893ee7501c2c";
      };
    }
    {
      name = "_types_normalize_package_data___normalize_package_data_2.4.0.tgz";
      path = fetchurl {
        name = "_types_normalize_package_data___normalize_package_data_2.4.0.tgz";
        url  = "https://registry.yarnpkg.com/@types/normalize-package-data/-/normalize-package-data-2.4.0.tgz";
        sha1 = "e486d0d97396d79beedd0a6e33f4534ff6b4973e";
      };
    }
    {
      name = "_types_parse_json___parse_json_4.0.0.tgz";
      path = fetchurl {
        name = "_types_parse_json___parse_json_4.0.0.tgz";
        url  = "https://registry.yarnpkg.com/@types/parse-json/-/parse-json-4.0.0.tgz";
        sha1 = "2f8bb441434d163b35fb8ffdccd7138927ffb8c0";
      };
    }
    {
      name = "_types_prettier___prettier_1.19.1.tgz";
      path = fetchurl {
        name = "_types_prettier___prettier_1.19.1.tgz";
        url  = "https://registry.yarnpkg.com/@types/prettier/-/prettier-1.19.1.tgz";
        sha1 = "33509849f8e679e4add158959fdb086440e9553f";
      };
    }
    {
      name = "_types_prop_types___prop_types_15.7.3.tgz";
      path = fetchurl {
        name = "_types_prop_types___prop_types_15.7.3.tgz";
        url  = "https://registry.yarnpkg.com/@types/prop-types/-/prop-types-15.7.3.tgz";
        sha1 = "2ab0d5da2e5815f94b0b9d4b95d1e5f243ab2ca7";
      };
    }
    {
      name = "_types_q___q_1.5.2.tgz";
      path = fetchurl {
        name = "_types_q___q_1.5.2.tgz";
        url  = "https://registry.yarnpkg.com/@types/q/-/q-1.5.2.tgz";
        sha1 = "690a1475b84f2a884fd07cd797c00f5f31356ea8";
      };
    }
    {
      name = "_types_react_lifecycles_compat___react_lifecycles_compat_3.0.1.tgz";
      path = fetchurl {
        name = "_types_react_lifecycles_compat___react_lifecycles_compat_3.0.1.tgz";
        url  = "https://registry.yarnpkg.com/@types/react-lifecycles-compat/-/react-lifecycles-compat-3.0.1.tgz";
        sha1 = "a0b1fe18cfb9435bd52737829a69cbe93faf32e2";
      };
    }
    {
      name = "_types_react_slick___react_slick_0.23.4.tgz";
      path = fetchurl {
        name = "_types_react_slick___react_slick_0.23.4.tgz";
        url  = "https://registry.yarnpkg.com/@types/react-slick/-/react-slick-0.23.4.tgz";
        sha1 = "c97e2a9e7e3d1933c68593b8e82752fab1e8ce53";
      };
    }
    {
      name = "_types_react___react_16.9.34.tgz";
      path = fetchurl {
        name = "_types_react___react_16.9.34.tgz";
        url  = "https://registry.yarnpkg.com/@types/react/-/react-16.9.34.tgz";
        sha1 = "f7d5e331c468f53affed17a8a4d488cd44ea9349";
      };
    }
    {
      name = "_types_react___react_16.9.44.tgz";
      path = fetchurl {
        name = "_types_react___react_16.9.44.tgz";
        url  = "https://registry.yarnpkg.com/@types/react/-/react-16.9.44.tgz";
        sha1 = "da84b179c031aef67dc92c33bd3401f1da2fa3bc";
      };
    }
    {
      name = "_types_shallowequal___shallowequal_1.1.1.tgz";
      path = fetchurl {
        name = "_types_shallowequal___shallowequal_1.1.1.tgz";
        url  = "https://registry.yarnpkg.com/@types/shallowequal/-/shallowequal-1.1.1.tgz";
        sha1 = "aad262bb3f2b1257d94c71d545268d592575c9b1";
      };
    }
    {
      name = "_types_stack_utils___stack_utils_1.0.1.tgz";
      path = fetchurl {
        name = "_types_stack_utils___stack_utils_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/@types/stack-utils/-/stack-utils-1.0.1.tgz";
        sha1 = "0a851d3bd96498fa25c33ab7278ed3bd65f06c3e";
      };
    }
    {
      name = "_types_yargs_parser___yargs_parser_15.0.0.tgz";
      path = fetchurl {
        name = "_types_yargs_parser___yargs_parser_15.0.0.tgz";
        url  = "https://registry.yarnpkg.com/@types/yargs-parser/-/yargs-parser-15.0.0.tgz";
        sha1 = "cb3f9f741869e20cce330ffbeb9271590483882d";
      };
    }
    {
      name = "_types_yargs___yargs_15.0.4.tgz";
      path = fetchurl {
        name = "_types_yargs___yargs_15.0.4.tgz";
        url  = "https://registry.yarnpkg.com/@types/yargs/-/yargs-15.0.4.tgz";
        sha1 = "7e5d0f8ca25e9d5849f2ea443cf7c402decd8299";
      };
    }
    {
      name = "_types_zen_observable___zen_observable_0.8.0.tgz";
      path = fetchurl {
        name = "_types_zen_observable___zen_observable_0.8.0.tgz";
        url  = "https://registry.yarnpkg.com/@types/zen-observable/-/zen-observable-0.8.0.tgz";
        sha1 = "8b63ab7f1aa5321248aad5ac890a485656dcea4d";
      };
    }
    {
      name = "_wry_context___context_0.4.4.tgz";
      path = fetchurl {
        name = "_wry_context___context_0.4.4.tgz";
        url  = "https://registry.yarnpkg.com/@wry/context/-/context-0.4.4.tgz";
        sha1 = "e50f5fa1d6cfaabf2977d1fda5ae91717f8815f8";
      };
    }
    {
      name = "_wry_equality___equality_0.1.11.tgz";
      path = fetchurl {
        name = "_wry_equality___equality_0.1.11.tgz";
        url  = "https://registry.yarnpkg.com/@wry/equality/-/equality-0.1.11.tgz";
        sha1 = "35cb156e4a96695aa81a9ecc4d03787bc17f1790";
      };
    }
    {
      name = "_xobotyi_scrollbar_width___scrollbar_width_1.9.5.tgz";
      path = fetchurl {
        name = "_xobotyi_scrollbar_width___scrollbar_width_1.9.5.tgz";
        url  = "https://registry.yarnpkg.com/@xobotyi/scrollbar-width/-/scrollbar-width-1.9.5.tgz";
        sha1 = "80224a6919272f405b87913ca13b92929bdf3c4d";
      };
    }
    {
      name = "abab___abab_2.0.3.tgz";
      path = fetchurl {
        name = "abab___abab_2.0.3.tgz";
        url  = "https://registry.yarnpkg.com/abab/-/abab-2.0.3.tgz";
        sha1 = "623e2075e02eb2d3f2475e49f99c91846467907a";
      };
    }
    {
      name = "abbrev___abbrev_1.1.1.tgz";
      path = fetchurl {
        name = "abbrev___abbrev_1.1.1.tgz";
        url  = "https://registry.yarnpkg.com/abbrev/-/abbrev-1.1.1.tgz";
        sha1 = "f8f2c887ad10bf67f634f005b6987fed3179aac8";
      };
    }
    {
      name = "ace_builds___ace_builds_1.4.12.tgz";
      path = fetchurl {
        name = "ace_builds___ace_builds_1.4.12.tgz";
        url  = "https://registry.yarnpkg.com/ace-builds/-/ace-builds-1.4.12.tgz";
        sha1 = "888efa386e36f4345f40b5233fcc4fe4c588fae7";
      };
    }
    {
      name = "acorn_globals___acorn_globals_4.3.4.tgz";
      path = fetchurl {
        name = "acorn_globals___acorn_globals_4.3.4.tgz";
        url  = "https://registry.yarnpkg.com/acorn-globals/-/acorn-globals-4.3.4.tgz";
        sha1 = "9fa1926addc11c97308c4e66d7add0d40c3272e7";
      };
    }
    {
      name = "acorn_node___acorn_node_1.8.2.tgz";
      path = fetchurl {
        name = "acorn_node___acorn_node_1.8.2.tgz";
        url  = "https://registry.yarnpkg.com/acorn-node/-/acorn-node-1.8.2.tgz";
        sha1 = "114c95d64539e53dede23de8b9d96df7c7ae2af8";
      };
    }
    {
      name = "acorn_walk___acorn_walk_6.2.0.tgz";
      path = fetchurl {
        name = "acorn_walk___acorn_walk_6.2.0.tgz";
        url  = "https://registry.yarnpkg.com/acorn-walk/-/acorn-walk-6.2.0.tgz";
        sha1 = "123cb8f3b84c2171f1f7fb252615b1c78a6b1a8c";
      };
    }
    {
      name = "acorn_walk___acorn_walk_7.1.1.tgz";
      path = fetchurl {
        name = "acorn_walk___acorn_walk_7.1.1.tgz";
        url  = "https://registry.yarnpkg.com/acorn-walk/-/acorn-walk-7.1.1.tgz";
        sha1 = "345f0dffad5c735e7373d2fec9a1023e6a44b83e";
      };
    }
    {
      name = "acorn___acorn_6.4.1.tgz";
      path = fetchurl {
        name = "acorn___acorn_6.4.1.tgz";
        url  = "https://registry.yarnpkg.com/acorn/-/acorn-6.4.1.tgz";
        sha1 = "531e58ba3f51b9dacb9a6646ca4debf5b14ca474";
      };
    }
    {
      name = "acorn___acorn_7.1.1.tgz";
      path = fetchurl {
        name = "acorn___acorn_7.1.1.tgz";
        url  = "https://registry.yarnpkg.com/acorn/-/acorn-7.1.1.tgz";
        sha1 = "e35668de0b402f359de515c5482a1ab9f89a69bf";
      };
    }
    {
      name = "add_dom_event_listener___add_dom_event_listener_1.1.0.tgz";
      path = fetchurl {
        name = "add_dom_event_listener___add_dom_event_listener_1.1.0.tgz";
        url  = "https://registry.yarnpkg.com/add-dom-event-listener/-/add-dom-event-listener-1.1.0.tgz";
        sha1 = "6a92db3a0dd0abc254e095c0f1dc14acbbaae310";
      };
    }
    {
      name = "ajv___ajv_6.12.2.tgz";
      path = fetchurl {
        name = "ajv___ajv_6.12.2.tgz";
        url  = "https://registry.yarnpkg.com/ajv/-/ajv-6.12.2.tgz";
        sha1 = "c629c5eced17baf314437918d2da88c99d5958cd";
      };
    }
    {
      name = "alphanum_sort___alphanum_sort_1.0.2.tgz";
      path = fetchurl {
        name = "alphanum_sort___alphanum_sort_1.0.2.tgz";
        url  = "https://registry.yarnpkg.com/alphanum-sort/-/alphanum-sort-1.0.2.tgz";
        sha1 = "97a1119649b211ad33691d9f9f486a8ec9fbe0a3";
      };
    }
    {
      name = "ansi_escapes___ansi_escapes_4.3.1.tgz";
      path = fetchurl {
        name = "ansi_escapes___ansi_escapes_4.3.1.tgz";
        url  = "https://registry.yarnpkg.com/ansi-escapes/-/ansi-escapes-4.3.1.tgz";
        sha1 = "a5c47cc43181f1f38ffd7076837700d395522a61";
      };
    }
    {
      name = "ansi_regex___ansi_regex_2.1.1.tgz";
      path = fetchurl {
        name = "ansi_regex___ansi_regex_2.1.1.tgz";
        url  = "https://registry.yarnpkg.com/ansi-regex/-/ansi-regex-2.1.1.tgz";
        sha1 = "c3b33ab5ee360d86e0e628f0468ae7ef27d654df";
      };
    }
    {
      name = "ansi_regex___ansi_regex_3.0.0.tgz";
      path = fetchurl {
        name = "ansi_regex___ansi_regex_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/ansi-regex/-/ansi-regex-3.0.0.tgz";
        sha1 = "ed0317c322064f79466c02966bddb605ab37d998";
      };
    }
    {
      name = "ansi_regex___ansi_regex_4.1.0.tgz";
      path = fetchurl {
        name = "ansi_regex___ansi_regex_4.1.0.tgz";
        url  = "https://registry.yarnpkg.com/ansi-regex/-/ansi-regex-4.1.0.tgz";
        sha1 = "8b9f8f08cf1acb843756a839ca8c7e3168c51997";
      };
    }
    {
      name = "ansi_regex___ansi_regex_5.0.0.tgz";
      path = fetchurl {
        name = "ansi_regex___ansi_regex_5.0.0.tgz";
        url  = "https://registry.yarnpkg.com/ansi-regex/-/ansi-regex-5.0.0.tgz";
        sha1 = "388539f55179bf39339c81af30a654d69f87cb75";
      };
    }
    {
      name = "ansi_styles___ansi_styles_2.2.1.tgz";
      path = fetchurl {
        name = "ansi_styles___ansi_styles_2.2.1.tgz";
        url  = "https://registry.yarnpkg.com/ansi-styles/-/ansi-styles-2.2.1.tgz";
        sha1 = "b432dd3358b634cf75e1e4664368240533c1ddbe";
      };
    }
    {
      name = "ansi_styles___ansi_styles_3.2.1.tgz";
      path = fetchurl {
        name = "ansi_styles___ansi_styles_3.2.1.tgz";
        url  = "https://registry.yarnpkg.com/ansi-styles/-/ansi-styles-3.2.1.tgz";
        sha1 = "41fbb20243e50b12be0f04b8dedbf07520ce841d";
      };
    }
    {
      name = "ansi_styles___ansi_styles_4.2.1.tgz";
      path = fetchurl {
        name = "ansi_styles___ansi_styles_4.2.1.tgz";
        url  = "https://registry.yarnpkg.com/ansi-styles/-/ansi-styles-4.2.1.tgz";
        sha1 = "90ae75c424d008d2624c5bf29ead3177ebfcf359";
      };
    }
    {
      name = "ansi_to_html___ansi_to_html_0.6.14.tgz";
      path = fetchurl {
        name = "ansi_to_html___ansi_to_html_0.6.14.tgz";
        url  = "https://registry.yarnpkg.com/ansi-to-html/-/ansi-to-html-0.6.14.tgz";
        sha1 = "65fe6d08bba5dd9db33f44a20aec331e0010dad8";
      };
    }
    {
      name = "ant_design_palettes___ant_design_palettes_1.1.3.tgz";
      path = fetchurl {
        name = "ant_design_palettes___ant_design_palettes_1.1.3.tgz";
        url  = "https://registry.yarnpkg.com/ant-design-palettes/-/ant-design-palettes-1.1.3.tgz";
        sha1 = "84119b1a4d86363adc52a38d587e65336a0a27dd";
      };
    }
    {
      name = "antd___antd_3.17.0.tgz";
      path = fetchurl {
        name = "antd___antd_3.17.0.tgz";
        url  = "https://registry.yarnpkg.com/antd/-/antd-3.17.0.tgz";
        sha1 = "d7eabadc3ffb499f9393fd865ac9a54d9b4345de";
      };
    }
    {
      name = "anymatch___anymatch_2.0.0.tgz";
      path = fetchurl {
        name = "anymatch___anymatch_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/anymatch/-/anymatch-2.0.0.tgz";
        sha1 = "bcb24b4f37934d9aa7ac17b4adaf89e7c76ef2eb";
      };
    }
    {
      name = "anymatch___anymatch_3.1.1.tgz";
      path = fetchurl {
        name = "anymatch___anymatch_3.1.1.tgz";
        url  = "https://registry.yarnpkg.com/anymatch/-/anymatch-3.1.1.tgz";
        sha1 = "c55ecf02185e2469259399310c173ce31233b142";
      };
    }
    {
      name = "apollo_cache_inmemory___apollo_cache_inmemory_1.6.5.tgz";
      path = fetchurl {
        name = "apollo_cache_inmemory___apollo_cache_inmemory_1.6.5.tgz";
        url  = "https://registry.yarnpkg.com/apollo-cache-inmemory/-/apollo-cache-inmemory-1.6.5.tgz";
        sha1 = "2ccaa3827686f6ed7fb634203dbf2b8d7015856a";
      };
    }
    {
      name = "apollo_cache___apollo_cache_1.3.4.tgz";
      path = fetchurl {
        name = "apollo_cache___apollo_cache_1.3.4.tgz";
        url  = "https://registry.yarnpkg.com/apollo-cache/-/apollo-cache-1.3.4.tgz";
        sha1 = "0c9f63c793e1cd6e34c450f7668e77aff58c9a42";
      };
    }
    {
      name = "apollo_client___apollo_client_2.6.8.tgz";
      path = fetchurl {
        name = "apollo_client___apollo_client_2.6.8.tgz";
        url  = "https://registry.yarnpkg.com/apollo-client/-/apollo-client-2.6.8.tgz";
        sha1 = "01cebc18692abf90c6b3806414e081696b0fa537";
      };
    }
    {
      name = "apollo_link_context___apollo_link_context_1.0.20.tgz";
      path = fetchurl {
        name = "apollo_link_context___apollo_link_context_1.0.20.tgz";
        url  = "https://registry.yarnpkg.com/apollo-link-context/-/apollo-link-context-1.0.20.tgz";
        sha1 = "1939ac5dc65d6dff0c855ee53521150053c24676";
      };
    }
    {
      name = "apollo_link_error___apollo_link_error_1.1.13.tgz";
      path = fetchurl {
        name = "apollo_link_error___apollo_link_error_1.1.13.tgz";
        url  = "https://registry.yarnpkg.com/apollo-link-error/-/apollo-link-error-1.1.13.tgz";
        sha1 = "c1a1bb876ffe380802c8df0506a32c33aad284cd";
      };
    }
    {
      name = "apollo_link_http_common___apollo_link_http_common_0.2.16.tgz";
      path = fetchurl {
        name = "apollo_link_http_common___apollo_link_http_common_0.2.16.tgz";
        url  = "https://registry.yarnpkg.com/apollo-link-http-common/-/apollo-link-http-common-0.2.16.tgz";
        sha1 = "756749dafc732792c8ca0923f9a40564b7c59ecc";
      };
    }
    {
      name = "apollo_link_http___apollo_link_http_1.5.17.tgz";
      path = fetchurl {
        name = "apollo_link_http___apollo_link_http_1.5.17.tgz";
        url  = "https://registry.yarnpkg.com/apollo-link-http/-/apollo-link-http-1.5.17.tgz";
        sha1 = "499e9f1711bf694497f02c51af12d82de5d8d8ba";
      };
    }
    {
      name = "apollo_link_ws___apollo_link_ws_1.0.20.tgz";
      path = fetchurl {
        name = "apollo_link_ws___apollo_link_ws_1.0.20.tgz";
        url  = "https://registry.yarnpkg.com/apollo-link-ws/-/apollo-link-ws-1.0.20.tgz";
        sha1 = "dfad44121f8445c6d7b7f8101a1b24813ba008ed";
      };
    }
    {
      name = "apollo_link___apollo_link_1.2.14.tgz";
      path = fetchurl {
        name = "apollo_link___apollo_link_1.2.14.tgz";
        url  = "https://registry.yarnpkg.com/apollo-link/-/apollo-link-1.2.14.tgz";
        sha1 = "3feda4b47f9ebba7f4160bef8b977ba725b684d9";
      };
    }
    {
      name = "apollo_upload_client___apollo_upload_client_9.1.0.tgz";
      path = fetchurl {
        name = "apollo_upload_client___apollo_upload_client_9.1.0.tgz";
        url  = "https://registry.yarnpkg.com/apollo-upload-client/-/apollo-upload-client-9.1.0.tgz";
        sha1 = "13191714ae07388088f2c773ebbfd53ba2f64c53";
      };
    }
    {
      name = "apollo_utilities___apollo_utilities_1.3.3.tgz";
      path = fetchurl {
        name = "apollo_utilities___apollo_utilities_1.3.3.tgz";
        url  = "https://registry.yarnpkg.com/apollo-utilities/-/apollo-utilities-1.3.3.tgz";
        sha1 = "f1854715a7be80cd810bc3ac95df085815c0787c";
      };
    }
    {
      name = "argparse___argparse_1.0.10.tgz";
      path = fetchurl {
        name = "argparse___argparse_1.0.10.tgz";
        url  = "https://registry.yarnpkg.com/argparse/-/argparse-1.0.10.tgz";
        sha1 = "bcd6791ea5ae09725e17e5ad988134cd40b3d911";
      };
    }
    {
      name = "arr_diff___arr_diff_4.0.0.tgz";
      path = fetchurl {
        name = "arr_diff___arr_diff_4.0.0.tgz";
        url  = "https://registry.yarnpkg.com/arr-diff/-/arr-diff-4.0.0.tgz";
        sha1 = "d6461074febfec71e7e15235761a329a5dc7c520";
      };
    }
    {
      name = "arr_flatten___arr_flatten_1.1.0.tgz";
      path = fetchurl {
        name = "arr_flatten___arr_flatten_1.1.0.tgz";
        url  = "https://registry.yarnpkg.com/arr-flatten/-/arr-flatten-1.1.0.tgz";
        sha1 = "36048bbff4e7b47e136644316c99669ea5ae91f1";
      };
    }
    {
      name = "arr_union___arr_union_3.1.0.tgz";
      path = fetchurl {
        name = "arr_union___arr_union_3.1.0.tgz";
        url  = "https://registry.yarnpkg.com/arr-union/-/arr-union-3.1.0.tgz";
        sha1 = "e39b09aea9def866a8f206e288af63919bae39c4";
      };
    }
    {
      name = "array_equal___array_equal_1.0.0.tgz";
      path = fetchurl {
        name = "array_equal___array_equal_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/array-equal/-/array-equal-1.0.0.tgz";
        sha1 = "8c2a5ef2472fd9ea742b04c77a75093ba2757c93";
      };
    }
    {
      name = "array_flat_polyfill___array_flat_polyfill_1.0.1.tgz";
      path = fetchurl {
        name = "array_flat_polyfill___array_flat_polyfill_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/array-flat-polyfill/-/array-flat-polyfill-1.0.1.tgz";
        sha1 = "1e3a4255be619dfbffbfd1d635c1cf357cd034e7";
      };
    }
    {
      name = "array_tree_filter___array_tree_filter_2.1.0.tgz";
      path = fetchurl {
        name = "array_tree_filter___array_tree_filter_2.1.0.tgz";
        url  = "https://registry.yarnpkg.com/array-tree-filter/-/array-tree-filter-2.1.0.tgz";
        sha1 = "873ac00fec83749f255ac8dd083814b4f6329190";
      };
    }
    {
      name = "array_union___array_union_1.0.2.tgz";
      path = fetchurl {
        name = "array_union___array_union_1.0.2.tgz";
        url  = "https://registry.yarnpkg.com/array-union/-/array-union-1.0.2.tgz";
        sha1 = "9a34410e4f4e3da23dea375be5be70f24778ec39";
      };
    }
    {
      name = "array_union___array_union_2.1.0.tgz";
      path = fetchurl {
        name = "array_union___array_union_2.1.0.tgz";
        url  = "https://registry.yarnpkg.com/array-union/-/array-union-2.1.0.tgz";
        sha1 = "b798420adbeb1de828d84acd8a2e23d3efe85e8d";
      };
    }
    {
      name = "array_uniq___array_uniq_1.0.3.tgz";
      path = fetchurl {
        name = "array_uniq___array_uniq_1.0.3.tgz";
        url  = "https://registry.yarnpkg.com/array-uniq/-/array-uniq-1.0.3.tgz";
        sha1 = "af6ac877a25cc7f74e058894753858dfdb24fdb6";
      };
    }
    {
      name = "array_unique___array_unique_0.3.2.tgz";
      path = fetchurl {
        name = "array_unique___array_unique_0.3.2.tgz";
        url  = "https://registry.yarnpkg.com/array-unique/-/array-unique-0.3.2.tgz";
        sha1 = "a894b75d4bc4f6cd679ef3244a9fd8f46ae2d428";
      };
    }
    {
      name = "asap___asap_2.0.6.tgz";
      path = fetchurl {
        name = "asap___asap_2.0.6.tgz";
        url  = "https://registry.yarnpkg.com/asap/-/asap-2.0.6.tgz";
        sha1 = "e50347611d7e690943208bbdafebcbc2fb866d46";
      };
    }
    {
      name = "asn1.js___asn1.js_4.10.1.tgz";
      path = fetchurl {
        name = "asn1.js___asn1.js_4.10.1.tgz";
        url  = "https://registry.yarnpkg.com/asn1.js/-/asn1.js-4.10.1.tgz";
        sha1 = "b9c2bf5805f1e64aadeed6df3a2bfafb5a73f5a0";
      };
    }
    {
      name = "asn1___asn1_0.2.4.tgz";
      path = fetchurl {
        name = "asn1___asn1_0.2.4.tgz";
        url  = "https://registry.yarnpkg.com/asn1/-/asn1-0.2.4.tgz";
        sha1 = "8d2475dfab553bb33e77b54e59e880bb8ce23136";
      };
    }
    {
      name = "assert_plus___assert_plus_1.0.0.tgz";
      path = fetchurl {
        name = "assert_plus___assert_plus_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/assert-plus/-/assert-plus-1.0.0.tgz";
        sha1 = "f12e0f3c5d77b0b1cdd9146942e4e96c1e4dd525";
      };
    }
    {
      name = "assert___assert_1.5.0.tgz";
      path = fetchurl {
        name = "assert___assert_1.5.0.tgz";
        url  = "https://registry.yarnpkg.com/assert/-/assert-1.5.0.tgz";
        sha1 = "55c109aaf6e0aefdb3dc4b71240c70bf574b18eb";
      };
    }
    {
      name = "assertion_error___assertion_error_1.1.0.tgz";
      path = fetchurl {
        name = "assertion_error___assertion_error_1.1.0.tgz";
        url  = "https://registry.yarnpkg.com/assertion-error/-/assertion-error-1.1.0.tgz";
        sha1 = "e60b6b0e8f301bd97e5375215bda406c85118c0b";
      };
    }
    {
      name = "assign_symbols___assign_symbols_1.0.0.tgz";
      path = fetchurl {
        name = "assign_symbols___assign_symbols_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/assign-symbols/-/assign-symbols-1.0.0.tgz";
        sha1 = "59667f41fadd4f20ccbc2bb96b8d4f7f78ec0367";
      };
    }
    {
      name = "astral_regex___astral_regex_1.0.0.tgz";
      path = fetchurl {
        name = "astral_regex___astral_regex_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/astral-regex/-/astral-regex-1.0.0.tgz";
        sha1 = "6c8c3fb827dd43ee3918f27b82782ab7658a6fd9";
      };
    }
    {
      name = "async_each___async_each_1.0.3.tgz";
      path = fetchurl {
        name = "async_each___async_each_1.0.3.tgz";
        url  = "https://registry.yarnpkg.com/async-each/-/async-each-1.0.3.tgz";
        sha1 = "b727dbf87d7651602f06f4d4ac387f47d91b0cbf";
      };
    }
    {
      name = "async_limiter___async_limiter_1.0.1.tgz";
      path = fetchurl {
        name = "async_limiter___async_limiter_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/async-limiter/-/async-limiter-1.0.1.tgz";
        sha1 = "dd379e94f0db8310b08291f9d64c3209766617fd";
      };
    }
    {
      name = "async_validator___async_validator_1.11.5.tgz";
      path = fetchurl {
        name = "async_validator___async_validator_1.11.5.tgz";
        url  = "https://registry.yarnpkg.com/async-validator/-/async-validator-1.11.5.tgz";
        sha1 = "9d43cf49ef6bb76be5442388d19fb9a6e47597ea";
      };
    }
    {
      name = "async___async_2.6.3.tgz";
      path = fetchurl {
        name = "async___async_2.6.3.tgz";
        url  = "https://registry.yarnpkg.com/async/-/async-2.6.3.tgz";
        sha1 = "d72625e2344a3656e3a3ad4fa749fa83299d82ff";
      };
    }
    {
      name = "asynckit___asynckit_0.4.0.tgz";
      path = fetchurl {
        name = "asynckit___asynckit_0.4.0.tgz";
        url  = "https://registry.yarnpkg.com/asynckit/-/asynckit-0.4.0.tgz";
        sha1 = "c79ed97f7f34cb8f2ba1bc9790bcc366474b4b79";
      };
    }
    {
      name = "atob___atob_2.1.2.tgz";
      path = fetchurl {
        name = "atob___atob_2.1.2.tgz";
        url  = "https://registry.yarnpkg.com/atob/-/atob-2.1.2.tgz";
        sha1 = "6d9517eb9e030d2436666651e86bd9f6f13533c9";
      };
    }
    {
      name = "autoprefixer___autoprefixer_9.7.4.tgz";
      path = fetchurl {
        name = "autoprefixer___autoprefixer_9.7.4.tgz";
        url  = "https://registry.yarnpkg.com/autoprefixer/-/autoprefixer-9.7.4.tgz";
        sha1 = "f8bf3e06707d047f0641d87aee8cfb174b2a5378";
      };
    }
    {
      name = "autoprefixer___autoprefixer_9.7.6.tgz";
      path = fetchurl {
        name = "autoprefixer___autoprefixer_9.7.6.tgz";
        url  = "https://registry.yarnpkg.com/autoprefixer/-/autoprefixer-9.7.6.tgz";
        sha1 = "63ac5bbc0ce7934e6997207d5bb00d68fa8293a4";
      };
    }
    {
      name = "aws_sign2___aws_sign2_0.7.0.tgz";
      path = fetchurl {
        name = "aws_sign2___aws_sign2_0.7.0.tgz";
        url  = "https://registry.yarnpkg.com/aws-sign2/-/aws-sign2-0.7.0.tgz";
        sha1 = "b46e890934a9591f2d2f6f86d7e6a9f1b3fe76a8";
      };
    }
    {
      name = "aws4___aws4_1.9.1.tgz";
      path = fetchurl {
        name = "aws4___aws4_1.9.1.tgz";
        url  = "https://registry.yarnpkg.com/aws4/-/aws4-1.9.1.tgz";
        sha1 = "7e33d8f7d449b3f673cd72deb9abdc552dbe528e";
      };
    }
    {
      name = "babel_code_frame___babel_code_frame_6.26.0.tgz";
      path = fetchurl {
        name = "babel_code_frame___babel_code_frame_6.26.0.tgz";
        url  = "https://registry.yarnpkg.com/babel-code-frame/-/babel-code-frame-6.26.0.tgz";
        sha1 = "63fd43f7dc1e3bb7ce35947db8fe369a3f58c74b";
      };
    }
    {
      name = "babel_jest___babel_jest_25.5.1.tgz";
      path = fetchurl {
        name = "babel_jest___babel_jest_25.5.1.tgz";
        url  = "https://registry.yarnpkg.com/babel-jest/-/babel-jest-25.5.1.tgz";
        sha1 = "bc2e6101f849d6f6aec09720ffc7bc5332e62853";
      };
    }
    {
      name = "babel_messages___babel_messages_6.23.0.tgz";
      path = fetchurl {
        name = "babel_messages___babel_messages_6.23.0.tgz";
        url  = "https://registry.yarnpkg.com/babel-messages/-/babel-messages-6.23.0.tgz";
        sha1 = "f3cdf4703858035b2a2951c6ec5edf6c62f2630e";
      };
    }
    {
      name = "babel_plugin_dynamic_import_node___babel_plugin_dynamic_import_node_2.3.3.tgz";
      path = fetchurl {
        name = "babel_plugin_dynamic_import_node___babel_plugin_dynamic_import_node_2.3.3.tgz";
        url  = "https://registry.yarnpkg.com/babel-plugin-dynamic-import-node/-/babel-plugin-dynamic-import-node-2.3.3.tgz";
        sha1 = "84fda19c976ec5c6defef57f9427b3def66e17a3";
      };
    }
    {
      name = "babel_plugin_emotion___babel_plugin_emotion_10.0.33.tgz";
      path = fetchurl {
        name = "babel_plugin_emotion___babel_plugin_emotion_10.0.33.tgz";
        url  = "https://registry.yarnpkg.com/babel-plugin-emotion/-/babel-plugin-emotion-10.0.33.tgz";
        sha1 = "ce1155dcd1783bbb9286051efee53f4e2be63e03";
      };
    }
    {
      name = "babel_plugin_istanbul___babel_plugin_istanbul_6.0.0.tgz";
      path = fetchurl {
        name = "babel_plugin_istanbul___babel_plugin_istanbul_6.0.0.tgz";
        url  = "https://registry.yarnpkg.com/babel-plugin-istanbul/-/babel-plugin-istanbul-6.0.0.tgz";
        sha1 = "e159ccdc9af95e0b570c75b4573b7c34d671d765";
      };
    }
    {
      name = "babel_plugin_jest_hoist___babel_plugin_jest_hoist_25.5.0.tgz";
      path = fetchurl {
        name = "babel_plugin_jest_hoist___babel_plugin_jest_hoist_25.5.0.tgz";
        url  = "https://registry.yarnpkg.com/babel-plugin-jest-hoist/-/babel-plugin-jest-hoist-25.5.0.tgz";
        sha1 = "129c80ba5c7fc75baf3a45b93e2e372d57ca2677";
      };
    }
    {
      name = "babel_plugin_macros___babel_plugin_macros_2.8.0.tgz";
      path = fetchurl {
        name = "babel_plugin_macros___babel_plugin_macros_2.8.0.tgz";
        url  = "https://registry.yarnpkg.com/babel-plugin-macros/-/babel-plugin-macros-2.8.0.tgz";
        sha1 = "0f958a7cc6556b1e65344465d99111a1e5e10138";
      };
    }
    {
      name = "babel_plugin_syntax_jsx___babel_plugin_syntax_jsx_6.18.0.tgz";
      path = fetchurl {
        name = "babel_plugin_syntax_jsx___babel_plugin_syntax_jsx_6.18.0.tgz";
        url  = "https://registry.yarnpkg.com/babel-plugin-syntax-jsx/-/babel-plugin-syntax-jsx-6.18.0.tgz";
        sha1 = "0af32a9a6e13ca7a3fd5069e62d7b0f58d0d8946";
      };
    }
    {
      name = "babel_plugin_transform_es2015_modules_commonjs___babel_plugin_transform_es2015_modules_commonjs_6.26.2.tgz";
      path = fetchurl {
        name = "babel_plugin_transform_es2015_modules_commonjs___babel_plugin_transform_es2015_modules_commonjs_6.26.2.tgz";
        url  = "https://registry.yarnpkg.com/babel-plugin-transform-es2015-modules-commonjs/-/babel-plugin-transform-es2015-modules-commonjs-6.26.2.tgz";
        sha1 = "58a793863a9e7ca870bdc5a881117ffac27db6f3";
      };
    }
    {
      name = "babel_plugin_transform_strict_mode___babel_plugin_transform_strict_mode_6.24.1.tgz";
      path = fetchurl {
        name = "babel_plugin_transform_strict_mode___babel_plugin_transform_strict_mode_6.24.1.tgz";
        url  = "https://registry.yarnpkg.com/babel-plugin-transform-strict-mode/-/babel-plugin-transform-strict-mode-6.24.1.tgz";
        sha1 = "d5faf7aa578a65bbe591cf5edae04a0c67020758";
      };
    }
    {
      name = "babel_preset_current_node_syntax___babel_preset_current_node_syntax_0.1.2.tgz";
      path = fetchurl {
        name = "babel_preset_current_node_syntax___babel_preset_current_node_syntax_0.1.2.tgz";
        url  = "https://registry.yarnpkg.com/babel-preset-current-node-syntax/-/babel-preset-current-node-syntax-0.1.2.tgz";
        sha1 = "fb4a4c51fe38ca60fede1dc74ab35eb843cb41d6";
      };
    }
    {
      name = "babel_preset_jest___babel_preset_jest_25.5.0.tgz";
      path = fetchurl {
        name = "babel_preset_jest___babel_preset_jest_25.5.0.tgz";
        url  = "https://registry.yarnpkg.com/babel-preset-jest/-/babel-preset-jest-25.5.0.tgz";
        sha1 = "c1d7f191829487a907764c65307faa0e66590b49";
      };
    }
    {
      name = "babel_runtime___babel_runtime_6.26.0.tgz";
      path = fetchurl {
        name = "babel_runtime___babel_runtime_6.26.0.tgz";
        url  = "https://registry.yarnpkg.com/babel-runtime/-/babel-runtime-6.26.0.tgz";
        sha1 = "965c7058668e82b55d7bfe04ff2337bc8b5647fe";
      };
    }
    {
      name = "babel_template___babel_template_6.26.0.tgz";
      path = fetchurl {
        name = "babel_template___babel_template_6.26.0.tgz";
        url  = "https://registry.yarnpkg.com/babel-template/-/babel-template-6.26.0.tgz";
        sha1 = "de03e2d16396b069f46dd9fff8521fb1a0e35e02";
      };
    }
    {
      name = "babel_traverse___babel_traverse_6.26.0.tgz";
      path = fetchurl {
        name = "babel_traverse___babel_traverse_6.26.0.tgz";
        url  = "https://registry.yarnpkg.com/babel-traverse/-/babel-traverse-6.26.0.tgz";
        sha1 = "46a9cbd7edcc62c8e5c064e2d2d8d0f4035766ee";
      };
    }
    {
      name = "babel_types___babel_types_6.26.0.tgz";
      path = fetchurl {
        name = "babel_types___babel_types_6.26.0.tgz";
        url  = "https://registry.yarnpkg.com/babel-types/-/babel-types-6.26.0.tgz";
        sha1 = "a3b073f94ab49eb6fa55cd65227a334380632497";
      };
    }
    {
      name = "babylon_walk___babylon_walk_1.0.2.tgz";
      path = fetchurl {
        name = "babylon_walk___babylon_walk_1.0.2.tgz";
        url  = "https://registry.yarnpkg.com/babylon-walk/-/babylon-walk-1.0.2.tgz";
        sha1 = "3b15a5ddbb482a78b4ce9c01c8ba181702d9d6ce";
      };
    }
    {
      name = "babylon___babylon_6.18.0.tgz";
      path = fetchurl {
        name = "babylon___babylon_6.18.0.tgz";
        url  = "https://registry.yarnpkg.com/babylon/-/babylon-6.18.0.tgz";
        sha1 = "af2f3b88fa6f5c1e4c634d1a0f8eac4f55b395e3";
      };
    }
    {
      name = "backo2___backo2_1.0.2.tgz";
      path = fetchurl {
        name = "backo2___backo2_1.0.2.tgz";
        url  = "https://registry.yarnpkg.com/backo2/-/backo2-1.0.2.tgz";
        sha1 = "31ab1ac8b129363463e35b3ebb69f4dfcfba7947";
      };
    }
    {
      name = "balanced_match___balanced_match_1.0.0.tgz";
      path = fetchurl {
        name = "balanced_match___balanced_match_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/balanced-match/-/balanced-match-1.0.0.tgz";
        sha1 = "89b4d199ab2bee49de164ea02b89ce462d71b767";
      };
    }
    {
      name = "base64_js___base64_js_1.3.1.tgz";
      path = fetchurl {
        name = "base64_js___base64_js_1.3.1.tgz";
        url  = "https://registry.yarnpkg.com/base64-js/-/base64-js-1.3.1.tgz";
        sha1 = "58ece8cb75dd07e71ed08c736abc5fac4dbf8df1";
      };
    }
    {
      name = "base___base_0.11.2.tgz";
      path = fetchurl {
        name = "base___base_0.11.2.tgz";
        url  = "https://registry.yarnpkg.com/base/-/base-0.11.2.tgz";
        sha1 = "7bde5ced145b6d551a90db87f83c558b4eb48a8f";
      };
    }
    {
      name = "bcrypt_pbkdf___bcrypt_pbkdf_1.0.2.tgz";
      path = fetchurl {
        name = "bcrypt_pbkdf___bcrypt_pbkdf_1.0.2.tgz";
        url  = "https://registry.yarnpkg.com/bcrypt-pbkdf/-/bcrypt-pbkdf-1.0.2.tgz";
        sha1 = "a4301d389b6a43f9b67ff3ca11a3f6637e360e9e";
      };
    }
    {
      name = "binary_extensions___binary_extensions_1.13.1.tgz";
      path = fetchurl {
        name = "binary_extensions___binary_extensions_1.13.1.tgz";
        url  = "https://registry.yarnpkg.com/binary-extensions/-/binary-extensions-1.13.1.tgz";
        sha1 = "598afe54755b2868a5330d2aff9d4ebb53209b65";
      };
    }
    {
      name = "binary_extensions___binary_extensions_2.0.0.tgz";
      path = fetchurl {
        name = "binary_extensions___binary_extensions_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/binary-extensions/-/binary-extensions-2.0.0.tgz";
        sha1 = "23c0df14f6a88077f5f986c0d167ec03c3d5537c";
      };
    }
    {
      name = "binary_search_tree___binary_search_tree_0.2.6.tgz";
      path = fetchurl {
        name = "binary_search_tree___binary_search_tree_0.2.6.tgz";
        url  = "https://registry.yarnpkg.com/binary-search-tree/-/binary-search-tree-0.2.6.tgz";
        sha1 = "c6d29194e286827fcffe079010e6bf77def10ce3";
      };
    }
    {
      name = "bindings___bindings_1.5.0.tgz";
      path = fetchurl {
        name = "bindings___bindings_1.5.0.tgz";
        url  = "https://registry.yarnpkg.com/bindings/-/bindings-1.5.0.tgz";
        sha1 = "10353c9e945334bc0511a6d90b38fbc7c9c504df";
      };
    }
    {
      name = "bn.js___bn.js_4.11.8.tgz";
      path = fetchurl {
        name = "bn.js___bn.js_4.11.8.tgz";
        url  = "https://registry.yarnpkg.com/bn.js/-/bn.js-4.11.8.tgz";
        sha1 = "2cde09eb5ee341f484746bb0309b3253b1b1442f";
      };
    }
    {
      name = "boolbase___boolbase_1.0.0.tgz";
      path = fetchurl {
        name = "boolbase___boolbase_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/boolbase/-/boolbase-1.0.0.tgz";
        sha1 = "68dff5fbe60c51eb37725ea9e3ed310dcc1e776e";
      };
    }
    {
      name = "bowser___bowser_1.9.4.tgz";
      path = fetchurl {
        name = "bowser___bowser_1.9.4.tgz";
        url  = "https://registry.yarnpkg.com/bowser/-/bowser-1.9.4.tgz";
        sha1 = "890c58a2813a9d3243704334fa81b96a5c150c9a";
      };
    }
    {
      name = "brace_expansion___brace_expansion_1.1.11.tgz";
      path = fetchurl {
        name = "brace_expansion___brace_expansion_1.1.11.tgz";
        url  = "https://registry.yarnpkg.com/brace-expansion/-/brace-expansion-1.1.11.tgz";
        sha1 = "3c7fcbf529d87226f3d2f52b966ff5271eb441dd";
      };
    }
    {
      name = "braces___braces_2.3.2.tgz";
      path = fetchurl {
        name = "braces___braces_2.3.2.tgz";
        url  = "https://registry.yarnpkg.com/braces/-/braces-2.3.2.tgz";
        sha1 = "5979fd3f14cd531565e5fa2df1abfff1dfaee729";
      };
    }
    {
      name = "braces___braces_3.0.2.tgz";
      path = fetchurl {
        name = "braces___braces_3.0.2.tgz";
        url  = "https://registry.yarnpkg.com/braces/-/braces-3.0.2.tgz";
        sha1 = "3454e1a462ee8d599e236df336cd9ea4f8afe107";
      };
    }
    {
      name = "brfs___brfs_1.6.1.tgz";
      path = fetchurl {
        name = "brfs___brfs_1.6.1.tgz";
        url  = "https://registry.yarnpkg.com/brfs/-/brfs-1.6.1.tgz";
        sha1 = "b78ce2336d818e25eea04a0947cba6d4fb8849c3";
      };
    }
    {
      name = "brorand___brorand_1.1.0.tgz";
      path = fetchurl {
        name = "brorand___brorand_1.1.0.tgz";
        url  = "https://registry.yarnpkg.com/brorand/-/brorand-1.1.0.tgz";
        sha1 = "12c25efe40a45e3c323eb8675a0a0ce57b22371f";
      };
    }
    {
      name = "browser_process_hrtime___browser_process_hrtime_1.0.0.tgz";
      path = fetchurl {
        name = "browser_process_hrtime___browser_process_hrtime_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/browser-process-hrtime/-/browser-process-hrtime-1.0.0.tgz";
        sha1 = "3c9b4b7d782c8121e56f10106d84c0d0ffc94626";
      };
    }
    {
      name = "browser_resolve___browser_resolve_1.11.3.tgz";
      path = fetchurl {
        name = "browser_resolve___browser_resolve_1.11.3.tgz";
        url  = "https://registry.yarnpkg.com/browser-resolve/-/browser-resolve-1.11.3.tgz";
        sha1 = "9b7cbb3d0f510e4cb86bdbd796124d28b5890af6";
      };
    }
    {
      name = "browserify_aes___browserify_aes_1.2.0.tgz";
      path = fetchurl {
        name = "browserify_aes___browserify_aes_1.2.0.tgz";
        url  = "https://registry.yarnpkg.com/browserify-aes/-/browserify-aes-1.2.0.tgz";
        sha1 = "326734642f403dabc3003209853bb70ad428ef48";
      };
    }
    {
      name = "browserify_cipher___browserify_cipher_1.0.1.tgz";
      path = fetchurl {
        name = "browserify_cipher___browserify_cipher_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/browserify-cipher/-/browserify-cipher-1.0.1.tgz";
        sha1 = "8d6474c1b870bfdabcd3bcfcc1934a10e94f15f0";
      };
    }
    {
      name = "browserify_des___browserify_des_1.0.2.tgz";
      path = fetchurl {
        name = "browserify_des___browserify_des_1.0.2.tgz";
        url  = "https://registry.yarnpkg.com/browserify-des/-/browserify-des-1.0.2.tgz";
        sha1 = "3af4f1f59839403572f1c66204375f7a7f703e9c";
      };
    }
    {
      name = "browserify_rsa___browserify_rsa_4.0.1.tgz";
      path = fetchurl {
        name = "browserify_rsa___browserify_rsa_4.0.1.tgz";
        url  = "https://registry.yarnpkg.com/browserify-rsa/-/browserify-rsa-4.0.1.tgz";
        sha1 = "21e0abfaf6f2029cf2fafb133567a701d4135524";
      };
    }
    {
      name = "browserify_sign___browserify_sign_4.0.4.tgz";
      path = fetchurl {
        name = "browserify_sign___browserify_sign_4.0.4.tgz";
        url  = "https://registry.yarnpkg.com/browserify-sign/-/browserify-sign-4.0.4.tgz";
        sha1 = "aa4eb68e5d7b658baa6bf6a57e630cbd7a93d298";
      };
    }
    {
      name = "browserify_zlib___browserify_zlib_0.2.0.tgz";
      path = fetchurl {
        name = "browserify_zlib___browserify_zlib_0.2.0.tgz";
        url  = "https://registry.yarnpkg.com/browserify-zlib/-/browserify-zlib-0.2.0.tgz";
        sha1 = "2869459d9aa3be245fe8fe2ca1f46e2e7f54d73f";
      };
    }
    {
      name = "browserslist___browserslist_4.12.0.tgz";
      path = fetchurl {
        name = "browserslist___browserslist_4.12.0.tgz";
        url  = "https://registry.yarnpkg.com/browserslist/-/browserslist-4.12.0.tgz";
        sha1 = "06c6d5715a1ede6c51fc39ff67fd647f740b656d";
      };
    }
    {
      name = "bs_ant_design_alt___bs_ant_design_alt_2.0.0_alpha.33.tgz";
      path = fetchurl {
        name = "bs_ant_design_alt___bs_ant_design_alt_2.0.0_alpha.33.tgz";
        url  = "https://registry.yarnpkg.com/bs-ant-design-alt/-/bs-ant-design-alt-2.0.0-alpha.33.tgz";
        sha1 = "13dc94f4fe4e7525485515cca2d2eae298940045";
      };
    }
    {
      name = "bs_css___bs_css_11.0.0.tgz";
      path = fetchurl {
        name = "bs_css___bs_css_11.0.0.tgz";
        url  = "https://registry.yarnpkg.com/bs-css/-/bs-css-11.0.0.tgz";
        sha1 = "6ed1726d7c06aa584d255d1cf23240a2acc0aa07";
      };
    }
    {
      name = "bs_moment___bs_moment_0.4.5.tgz";
      path = fetchurl {
        name = "bs_moment___bs_moment_0.4.5.tgz";
        url  = "https://registry.yarnpkg.com/bs-moment/-/bs-moment-0.4.5.tgz";
        sha1 = "3f84fed55c2a70d25b0b6025e4e8d821fcdd4dc8";
      };
    }
    {
      name = "bs_platform___bs_platform_7.2.2.tgz";
      path = fetchurl {
        name = "bs_platform___bs_platform_7.2.2.tgz";
        url  = "https://registry.yarnpkg.com/bs-platform/-/bs-platform-7.2.2.tgz";
        sha1 = "76fdc63e4889458ae3d257a0132107a792f2309c";
      };
    }
    {
      name = "bs_platform___bs_platform_7.3.2.tgz";
      path = fetchurl {
        name = "bs_platform___bs_platform_7.3.2.tgz";
        url  = "https://registry.yarnpkg.com/bs-platform/-/bs-platform-7.3.2.tgz";
        sha1 = "301f5c9b4e8cf5713cb60ca22e145e56e793affe";
      };
    }
    {
      name = "bs_reform___bs_reform_10.0.3.tgz";
      path = fetchurl {
        name = "bs_reform___bs_reform_10.0.3.tgz";
        url  = "https://registry.yarnpkg.com/bs-reform/-/bs-reform-10.0.3.tgz";
        sha1 = "babe65f729fcc12b4a020736bd6102abdf4c44ff";
      };
    }
    {
      name = "bsb_js___bsb_js_1.1.7.tgz";
      path = fetchurl {
        name = "bsb_js___bsb_js_1.1.7.tgz";
        url  = "https://registry.yarnpkg.com/bsb-js/-/bsb-js-1.1.7.tgz";
        sha1 = "12cc91e974f5896b3a2aa8358419d24e56f552c3";
      };
    }
    {
      name = "bser___bser_2.1.1.tgz";
      path = fetchurl {
        name = "bser___bser_2.1.1.tgz";
        url  = "https://registry.yarnpkg.com/bser/-/bser-2.1.1.tgz";
        sha1 = "e6787da20ece9d07998533cfd9de6f5c38f4bc05";
      };
    }
    {
      name = "buffer_equal___buffer_equal_0.0.1.tgz";
      path = fetchurl {
        name = "buffer_equal___buffer_equal_0.0.1.tgz";
        url  = "https://registry.yarnpkg.com/buffer-equal/-/buffer-equal-0.0.1.tgz";
        sha1 = "91bc74b11ea405bc916bc6aa908faafa5b4aac4b";
      };
    }
    {
      name = "buffer_from___buffer_from_1.1.1.tgz";
      path = fetchurl {
        name = "buffer_from___buffer_from_1.1.1.tgz";
        url  = "https://registry.yarnpkg.com/buffer-from/-/buffer-from-1.1.1.tgz";
        sha1 = "32713bc028f75c02fdb710d7c7bcec1f2c6070ef";
      };
    }
    {
      name = "buffer_xor___buffer_xor_1.0.3.tgz";
      path = fetchurl {
        name = "buffer_xor___buffer_xor_1.0.3.tgz";
        url  = "https://registry.yarnpkg.com/buffer-xor/-/buffer-xor-1.0.3.tgz";
        sha1 = "26e61ed1422fb70dd42e6e36729ed51d855fe8d9";
      };
    }
    {
      name = "buffer___buffer_4.9.2.tgz";
      path = fetchurl {
        name = "buffer___buffer_4.9.2.tgz";
        url  = "https://registry.yarnpkg.com/buffer/-/buffer-4.9.2.tgz";
        sha1 = "230ead344002988644841ab0244af8c44bbe3ef8";
      };
    }
    {
      name = "builtin_status_codes___builtin_status_codes_3.0.0.tgz";
      path = fetchurl {
        name = "builtin_status_codes___builtin_status_codes_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/builtin-status-codes/-/builtin-status-codes-3.0.0.tgz";
        sha1 = "85982878e21b98e1c66425e03d0174788f569ee8";
      };
    }
    {
      name = "bytes___bytes_3.1.0.tgz";
      path = fetchurl {
        name = "bytes___bytes_3.1.0.tgz";
        url  = "https://registry.yarnpkg.com/bytes/-/bytes-3.1.0.tgz";
        sha1 = "f6cf7933a360e0588fa9fde85651cdc7f805d1f6";
      };
    }
    {
      name = "cache_base___cache_base_1.0.1.tgz";
      path = fetchurl {
        name = "cache_base___cache_base_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/cache-base/-/cache-base-1.0.1.tgz";
        sha1 = "0a7f46416831c8b662ee36fe4e7c59d76f666ab2";
      };
    }
    {
      name = "call_me_maybe___call_me_maybe_1.0.1.tgz";
      path = fetchurl {
        name = "call_me_maybe___call_me_maybe_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/call-me-maybe/-/call-me-maybe-1.0.1.tgz";
        sha1 = "26d208ea89e37b5cbde60250a15f031c16a4d66b";
      };
    }
    {
      name = "caller_callsite___caller_callsite_2.0.0.tgz";
      path = fetchurl {
        name = "caller_callsite___caller_callsite_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/caller-callsite/-/caller-callsite-2.0.0.tgz";
        sha1 = "847e0fce0a223750a9a027c54b33731ad3154134";
      };
    }
    {
      name = "caller_path___caller_path_2.0.0.tgz";
      path = fetchurl {
        name = "caller_path___caller_path_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/caller-path/-/caller-path-2.0.0.tgz";
        sha1 = "468f83044e369ab2010fac5f06ceee15bb2cb1f4";
      };
    }
    {
      name = "callsites___callsites_2.0.0.tgz";
      path = fetchurl {
        name = "callsites___callsites_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/callsites/-/callsites-2.0.0.tgz";
        sha1 = "06eb84f00eea413da86affefacbffb36093b3c50";
      };
    }
    {
      name = "callsites___callsites_3.1.0.tgz";
      path = fetchurl {
        name = "callsites___callsites_3.1.0.tgz";
        url  = "https://registry.yarnpkg.com/callsites/-/callsites-3.1.0.tgz";
        sha1 = "b3630abd8943432f54b3f0519238e33cd7df2f73";
      };
    }
    {
      name = "camel_case___camel_case_3.0.0.tgz";
      path = fetchurl {
        name = "camel_case___camel_case_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/camel-case/-/camel-case-3.0.0.tgz";
        sha1 = "ca3c3688a4e9cf3a4cda777dc4dcbc713249cf73";
      };
    }
    {
      name = "camelcase_css___camelcase_css_2.0.1.tgz";
      path = fetchurl {
        name = "camelcase_css___camelcase_css_2.0.1.tgz";
        url  = "https://registry.yarnpkg.com/camelcase-css/-/camelcase-css-2.0.1.tgz";
        sha1 = "ee978f6947914cc30c6b44741b6ed1df7f043fd5";
      };
    }
    {
      name = "camelcase___camelcase_4.1.0.tgz";
      path = fetchurl {
        name = "camelcase___camelcase_4.1.0.tgz";
        url  = "https://registry.yarnpkg.com/camelcase/-/camelcase-4.1.0.tgz";
        sha1 = "d545635be1e33c542649c69173e5de6acfae34dd";
      };
    }
    {
      name = "camelcase___camelcase_5.3.1.tgz";
      path = fetchurl {
        name = "camelcase___camelcase_5.3.1.tgz";
        url  = "https://registry.yarnpkg.com/camelcase/-/camelcase-5.3.1.tgz";
        sha1 = "e3c9b31569e106811df242f715725a1f4c494320";
      };
    }
    {
      name = "caniuse_api___caniuse_api_3.0.0.tgz";
      path = fetchurl {
        name = "caniuse_api___caniuse_api_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/caniuse-api/-/caniuse-api-3.0.0.tgz";
        sha1 = "5e4d90e2274961d46291997df599e3ed008ee4c0";
      };
    }
    {
      name = "caniuse_lite___caniuse_lite_1.0.30001048.tgz";
      path = fetchurl {
        name = "caniuse_lite___caniuse_lite_1.0.30001048.tgz";
        url  = "https://registry.yarnpkg.com/caniuse-lite/-/caniuse-lite-1.0.30001048.tgz";
        sha1 = "4bb4f1bc2eb304e5e1154da80b93dee3f1cf447e";
      };
    }
    {
      name = "capture_exit___capture_exit_2.0.0.tgz";
      path = fetchurl {
        name = "capture_exit___capture_exit_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/capture-exit/-/capture-exit-2.0.0.tgz";
        sha1 = "fb953bfaebeb781f62898239dabb426d08a509a4";
      };
    }
    {
      name = "caseless___caseless_0.12.0.tgz";
      path = fetchurl {
        name = "caseless___caseless_0.12.0.tgz";
        url  = "https://registry.yarnpkg.com/caseless/-/caseless-0.12.0.tgz";
        sha1 = "1b681c21ff84033c826543090689420d187151dc";
      };
    }
    {
      name = "chai___chai_3.5.0.tgz";
      path = fetchurl {
        name = "chai___chai_3.5.0.tgz";
        url  = "https://registry.yarnpkg.com/chai/-/chai-3.5.0.tgz";
        sha1 = "4d02637b067fe958bdbfdd3a40ec56fef7373247";
      };
    }
    {
      name = "chalk___chalk_1.1.3.tgz";
      path = fetchurl {
        name = "chalk___chalk_1.1.3.tgz";
        url  = "https://registry.yarnpkg.com/chalk/-/chalk-1.1.3.tgz";
        sha1 = "a8115c55e4a702fe4d150abd3872822a7e09fc98";
      };
    }
    {
      name = "chalk___chalk_2.4.2.tgz";
      path = fetchurl {
        name = "chalk___chalk_2.4.2.tgz";
        url  = "https://registry.yarnpkg.com/chalk/-/chalk-2.4.2.tgz";
        sha1 = "cd42541677a54333cf541a49108c1432b44c9424";
      };
    }
    {
      name = "chalk___chalk_3.0.0.tgz";
      path = fetchurl {
        name = "chalk___chalk_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/chalk/-/chalk-3.0.0.tgz";
        sha1 = "3f73c2bf526591f574cc492c51e2456349f844e4";
      };
    }
    {
      name = "chokidar___chokidar_2.1.8.tgz";
      path = fetchurl {
        name = "chokidar___chokidar_2.1.8.tgz";
        url  = "https://registry.yarnpkg.com/chokidar/-/chokidar-2.1.8.tgz";
        sha1 = "804b3a7b6a99358c3c5c61e71d8728f041cff917";
      };
    }
    {
      name = "chokidar___chokidar_3.4.0.tgz";
      path = fetchurl {
        name = "chokidar___chokidar_3.4.0.tgz";
        url  = "https://registry.yarnpkg.com/chokidar/-/chokidar-3.4.0.tgz";
        sha1 = "b30611423ce376357c765b9b8f904b9fba3c0be8";
      };
    }
    {
      name = "ci_info___ci_info_2.0.0.tgz";
      path = fetchurl {
        name = "ci_info___ci_info_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/ci-info/-/ci-info-2.0.0.tgz";
        sha1 = "67a9e964be31a51e15e5010d58e6f12834002f46";
      };
    }
    {
      name = "cipher_base___cipher_base_1.0.4.tgz";
      path = fetchurl {
        name = "cipher_base___cipher_base_1.0.4.tgz";
        url  = "https://registry.yarnpkg.com/cipher-base/-/cipher-base-1.0.4.tgz";
        sha1 = "8760e4ecc272f4c363532f926d874aae2c1397de";
      };
    }
    {
      name = "class_utils___class_utils_0.3.6.tgz";
      path = fetchurl {
        name = "class_utils___class_utils_0.3.6.tgz";
        url  = "https://registry.yarnpkg.com/class-utils/-/class-utils-0.3.6.tgz";
        sha1 = "f93369ae8b9a7ce02fd41faad0ca83033190c463";
      };
    }
    {
      name = "classnames___classnames_2.2.6.tgz";
      path = fetchurl {
        name = "classnames___classnames_2.2.6.tgz";
        url  = "https://registry.yarnpkg.com/classnames/-/classnames-2.2.6.tgz";
        sha1 = "43935bffdd291f326dad0a205309b38d00f650ce";
      };
    }
    {
      name = "cli_cursor___cli_cursor_2.1.0.tgz";
      path = fetchurl {
        name = "cli_cursor___cli_cursor_2.1.0.tgz";
        url  = "https://registry.yarnpkg.com/cli-cursor/-/cli-cursor-2.1.0.tgz";
        sha1 = "b35dac376479facc3e94747d41d0d0f5238ffcb5";
      };
    }
    {
      name = "cli_spinners___cli_spinners_1.3.1.tgz";
      path = fetchurl {
        name = "cli_spinners___cli_spinners_1.3.1.tgz";
        url  = "https://registry.yarnpkg.com/cli-spinners/-/cli-spinners-1.3.1.tgz";
        sha1 = "002c1990912d0d59580c93bd36c056de99e4259a";
      };
    }
    {
      name = "cliui___cliui_4.1.0.tgz";
      path = fetchurl {
        name = "cliui___cliui_4.1.0.tgz";
        url  = "https://registry.yarnpkg.com/cliui/-/cliui-4.1.0.tgz";
        sha1 = "348422dbe82d800b3022eef4f6ac10bf2e4d1b49";
      };
    }
    {
      name = "cliui___cliui_5.0.0.tgz";
      path = fetchurl {
        name = "cliui___cliui_5.0.0.tgz";
        url  = "https://registry.yarnpkg.com/cliui/-/cliui-5.0.0.tgz";
        sha1 = "deefcfdb2e800784aa34f46fa08e06851c7bbbc5";
      };
    }
    {
      name = "cliui___cliui_6.0.0.tgz";
      path = fetchurl {
        name = "cliui___cliui_6.0.0.tgz";
        url  = "https://registry.yarnpkg.com/cliui/-/cliui-6.0.0.tgz";
        sha1 = "511d702c0c4e41ca156d7d0e96021f23e13225b1";
      };
    }
    {
      name = "cliui___cliui_7.0.3.tgz";
      path = fetchurl {
        name = "cliui___cliui_7.0.3.tgz";
        url  = "https://registry.yarnpkg.com/cliui/-/cliui-7.0.3.tgz";
        sha1 = "ef180f26c8d9bff3927ee52428bfec2090427981";
      };
    }
    {
      name = "clone___clone_1.0.4.tgz";
      path = fetchurl {
        name = "clone___clone_1.0.4.tgz";
        url  = "https://registry.yarnpkg.com/clone/-/clone-1.0.4.tgz";
        sha1 = "da309cc263df15994c688ca902179ca3c7cd7c7e";
      };
    }
    {
      name = "clone___clone_2.1.2.tgz";
      path = fetchurl {
        name = "clone___clone_2.1.2.tgz";
        url  = "https://registry.yarnpkg.com/clone/-/clone-2.1.2.tgz";
        sha1 = "1b7f4b9f591f1e8f83670401600345a02887435f";
      };
    }
    {
      name = "clones___clones_1.2.0.tgz";
      path = fetchurl {
        name = "clones___clones_1.2.0.tgz";
        url  = "https://registry.yarnpkg.com/clones/-/clones-1.2.0.tgz";
        sha1 = "b34c872045446a9f264ccceb7731bca05c529b71";
      };
    }
    {
      name = "co___co_4.6.0.tgz";
      path = fetchurl {
        name = "co___co_4.6.0.tgz";
        url  = "https://registry.yarnpkg.com/co/-/co-4.6.0.tgz";
        sha1 = "6ea6bdf3d853ae54ccb8e47bfa0bf3f9031fb184";
      };
    }
    {
      name = "coa___coa_2.0.2.tgz";
      path = fetchurl {
        name = "coa___coa_2.0.2.tgz";
        url  = "https://registry.yarnpkg.com/coa/-/coa-2.0.2.tgz";
        sha1 = "43f6c21151b4ef2bf57187db0d73de229e3e7ec3";
      };
    }
    {
      name = "code_point_at___code_point_at_1.1.0.tgz";
      path = fetchurl {
        name = "code_point_at___code_point_at_1.1.0.tgz";
        url  = "https://registry.yarnpkg.com/code-point-at/-/code-point-at-1.1.0.tgz";
        sha1 = "0d070b4d043a5bea33a2f1a40e2edb3d9a4ccf77";
      };
    }
    {
      name = "collect_v8_coverage___collect_v8_coverage_1.0.1.tgz";
      path = fetchurl {
        name = "collect_v8_coverage___collect_v8_coverage_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/collect-v8-coverage/-/collect-v8-coverage-1.0.1.tgz";
        sha1 = "cc2c8e94fc18bbdffe64d6534570c8a673b27f59";
      };
    }
    {
      name = "collection_visit___collection_visit_1.0.0.tgz";
      path = fetchurl {
        name = "collection_visit___collection_visit_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/collection-visit/-/collection-visit-1.0.0.tgz";
        sha1 = "4bc0373c164bc3291b4d368c829cf1a80a59dca0";
      };
    }
    {
      name = "color_convert___color_convert_1.9.3.tgz";
      path = fetchurl {
        name = "color_convert___color_convert_1.9.3.tgz";
        url  = "https://registry.yarnpkg.com/color-convert/-/color-convert-1.9.3.tgz";
        sha1 = "bb71850690e1f136567de629d2d5471deda4c1e8";
      };
    }
    {
      name = "color_convert___color_convert_2.0.1.tgz";
      path = fetchurl {
        name = "color_convert___color_convert_2.0.1.tgz";
        url  = "https://registry.yarnpkg.com/color-convert/-/color-convert-2.0.1.tgz";
        sha1 = "72d3a68d598c9bdb3af2ad1e84f21d896abd4de3";
      };
    }
    {
      name = "color_name___color_name_1.1.3.tgz";
      path = fetchurl {
        name = "color_name___color_name_1.1.3.tgz";
        url  = "https://registry.yarnpkg.com/color-name/-/color-name-1.1.3.tgz";
        sha1 = "a7d0558bd89c42f795dd42328f740831ca53bc25";
      };
    }
    {
      name = "color_name___color_name_1.1.4.tgz";
      path = fetchurl {
        name = "color_name___color_name_1.1.4.tgz";
        url  = "https://registry.yarnpkg.com/color-name/-/color-name-1.1.4.tgz";
        sha1 = "c2a09a87acbde69543de6f63fa3995c826c536a2";
      };
    }
    {
      name = "color_string___color_string_1.5.3.tgz";
      path = fetchurl {
        name = "color_string___color_string_1.5.3.tgz";
        url  = "https://registry.yarnpkg.com/color-string/-/color-string-1.5.3.tgz";
        sha1 = "c9bbc5f01b58b5492f3d6857459cb6590ce204cc";
      };
    }
    {
      name = "color___color_3.1.2.tgz";
      path = fetchurl {
        name = "color___color_3.1.2.tgz";
        url  = "https://registry.yarnpkg.com/color/-/color-3.1.2.tgz";
        sha1 = "68148e7f85d41ad7649c5fa8c8106f098d229e10";
      };
    }
    {
      name = "combined_stream___combined_stream_1.0.8.tgz";
      path = fetchurl {
        name = "combined_stream___combined_stream_1.0.8.tgz";
        url  = "https://registry.yarnpkg.com/combined-stream/-/combined-stream-1.0.8.tgz";
        sha1 = "c3d45a8b34fd730631a110a8a2520682b31d5a7f";
      };
    }
    {
      name = "command_exists___command_exists_1.2.9.tgz";
      path = fetchurl {
        name = "command_exists___command_exists_1.2.9.tgz";
        url  = "https://registry.yarnpkg.com/command-exists/-/command-exists-1.2.9.tgz";
        sha1 = "c50725af3808c8ab0260fd60b01fbfa25b954f69";
      };
    }
    {
      name = "commander___commander_2.20.3.tgz";
      path = fetchurl {
        name = "commander___commander_2.20.3.tgz";
        url  = "https://registry.yarnpkg.com/commander/-/commander-2.20.3.tgz";
        sha1 = "fd485e84c03eb4881c20722ba48035e8531aeb33";
      };
    }
    {
      name = "complex.js___complex.js_2.0.11.tgz";
      path = fetchurl {
        name = "complex.js___complex.js_2.0.11.tgz";
        url  = "https://registry.yarnpkg.com/complex.js/-/complex.js-2.0.11.tgz";
        sha1 = "09a873fbf15ffd8c18c9c2201ccef425c32b8bf1";
      };
    }
    {
      name = "component_classes___component_classes_1.2.6.tgz";
      path = fetchurl {
        name = "component_classes___component_classes_1.2.6.tgz";
        url  = "https://registry.yarnpkg.com/component-classes/-/component-classes-1.2.6.tgz";
        sha1 = "c642394c3618a4d8b0b8919efccbbd930e5cd691";
      };
    }
    {
      name = "component_emitter___component_emitter_1.3.0.tgz";
      path = fetchurl {
        name = "component_emitter___component_emitter_1.3.0.tgz";
        url  = "https://registry.yarnpkg.com/component-emitter/-/component-emitter-1.3.0.tgz";
        sha1 = "16e4070fba8ae29b679f2215853ee181ab2eabc0";
      };
    }
    {
      name = "component_indexof___component_indexof_0.0.3.tgz";
      path = fetchurl {
        name = "component_indexof___component_indexof_0.0.3.tgz";
        url  = "https://registry.yarnpkg.com/component-indexof/-/component-indexof-0.0.3.tgz";
        sha1 = "11d091312239eb8f32c8f25ae9cb002ffe8d3c24";
      };
    }
    {
      name = "compute_scroll_into_view___compute_scroll_into_view_1.0.13.tgz";
      path = fetchurl {
        name = "compute_scroll_into_view___compute_scroll_into_view_1.0.13.tgz";
        url  = "https://registry.yarnpkg.com/compute-scroll-into-view/-/compute-scroll-into-view-1.0.13.tgz";
        sha1 = "be1b1663b0e3f56cd5f7713082549f562a3477e2";
      };
    }
    {
      name = "concat_map___concat_map_0.0.1.tgz";
      path = fetchurl {
        name = "concat_map___concat_map_0.0.1.tgz";
        url  = "https://registry.yarnpkg.com/concat-map/-/concat-map-0.0.1.tgz";
        sha1 = "d8a96bd77fd68df7793a73036a3ba0d5405d477b";
      };
    }
    {
      name = "concat_stream___concat_stream_1.6.2.tgz";
      path = fetchurl {
        name = "concat_stream___concat_stream_1.6.2.tgz";
        url  = "https://registry.yarnpkg.com/concat-stream/-/concat-stream-1.6.2.tgz";
        sha1 = "904bdf194cd3122fc675c77fc4ac3d4ff0fd1a34";
      };
    }
    {
      name = "config_chain___config_chain_1.1.12.tgz";
      path = fetchurl {
        name = "config_chain___config_chain_1.1.12.tgz";
        url  = "https://registry.yarnpkg.com/config-chain/-/config-chain-1.1.12.tgz";
        sha1 = "0fde8d091200eb5e808caf25fe618c02f48e4efa";
      };
    }
    {
      name = "console_browserify___console_browserify_1.2.0.tgz";
      path = fetchurl {
        name = "console_browserify___console_browserify_1.2.0.tgz";
        url  = "https://registry.yarnpkg.com/console-browserify/-/console-browserify-1.2.0.tgz";
        sha1 = "67063cef57ceb6cf4993a2ab3a55840ae8c49336";
      };
    }
    {
      name = "constants_browserify___constants_browserify_1.0.0.tgz";
      path = fetchurl {
        name = "constants_browserify___constants_browserify_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/constants-browserify/-/constants-browserify-1.0.0.tgz";
        sha1 = "c20b96d8c617748aaf1c16021760cd27fcb8cb75";
      };
    }
    {
      name = "convert_source_map___convert_source_map_1.7.0.tgz";
      path = fetchurl {
        name = "convert_source_map___convert_source_map_1.7.0.tgz";
        url  = "https://registry.yarnpkg.com/convert-source-map/-/convert-source-map-1.7.0.tgz";
        sha1 = "17a2cb882d7f77d3490585e2ce6c524424a3a442";
      };
    }
    {
      name = "copy_descriptor___copy_descriptor_0.1.1.tgz";
      path = fetchurl {
        name = "copy_descriptor___copy_descriptor_0.1.1.tgz";
        url  = "https://registry.yarnpkg.com/copy-descriptor/-/copy-descriptor-0.1.1.tgz";
        sha1 = "676f6eb3c39997c2ee1ac3a924fd6124748f578d";
      };
    }
    {
      name = "copy_to_clipboard___copy_to_clipboard_3.3.1.tgz";
      path = fetchurl {
        name = "copy_to_clipboard___copy_to_clipboard_3.3.1.tgz";
        url  = "https://registry.yarnpkg.com/copy-to-clipboard/-/copy-to-clipboard-3.3.1.tgz";
        sha1 = "115aa1a9998ffab6196f93076ad6da3b913662ae";
      };
    }
    {
      name = "core_js_compat___core_js_compat_3.6.5.tgz";
      path = fetchurl {
        name = "core_js_compat___core_js_compat_3.6.5.tgz";
        url  = "https://registry.yarnpkg.com/core-js-compat/-/core-js-compat-3.6.5.tgz";
        sha1 = "2a51d9a4e25dfd6e690251aa81f99e3c05481f1c";
      };
    }
    {
      name = "core_js___core_js_1.2.7.tgz";
      path = fetchurl {
        name = "core_js___core_js_1.2.7.tgz";
        url  = "https://registry.yarnpkg.com/core-js/-/core-js-1.2.7.tgz";
        sha1 = "652294c14651db28fa93bd2d5ff2983a4f08c636";
      };
    }
    {
      name = "core_js___core_js_2.6.11.tgz";
      path = fetchurl {
        name = "core_js___core_js_2.6.11.tgz";
        url  = "https://registry.yarnpkg.com/core-js/-/core-js-2.6.11.tgz";
        sha1 = "38831469f9922bded8ee21c9dc46985e0399308c";
      };
    }
    {
      name = "core_util_is___core_util_is_1.0.2.tgz";
      path = fetchurl {
        name = "core_util_is___core_util_is_1.0.2.tgz";
        url  = "https://registry.yarnpkg.com/core-util-is/-/core-util-is-1.0.2.tgz";
        sha1 = "b5fd54220aa2bc5ab57aab7140c940754503c1a7";
      };
    }
    {
      name = "cosmiconfig___cosmiconfig_5.2.1.tgz";
      path = fetchurl {
        name = "cosmiconfig___cosmiconfig_5.2.1.tgz";
        url  = "https://registry.yarnpkg.com/cosmiconfig/-/cosmiconfig-5.2.1.tgz";
        sha1 = "040f726809c591e77a17c0a3626ca45b4f168b1a";
      };
    }
    {
      name = "cosmiconfig___cosmiconfig_6.0.0.tgz";
      path = fetchurl {
        name = "cosmiconfig___cosmiconfig_6.0.0.tgz";
        url  = "https://registry.yarnpkg.com/cosmiconfig/-/cosmiconfig-6.0.0.tgz";
        sha1 = "da4fee853c52f6b1e6935f41c1a2fc50bd4a9982";
      };
    }
    {
      name = "create_ecdh___create_ecdh_4.0.3.tgz";
      path = fetchurl {
        name = "create_ecdh___create_ecdh_4.0.3.tgz";
        url  = "https://registry.yarnpkg.com/create-ecdh/-/create-ecdh-4.0.3.tgz";
        sha1 = "c9111b6f33045c4697f144787f9254cdc77c45ff";
      };
    }
    {
      name = "create_emotion___create_emotion_10.0.27.tgz";
      path = fetchurl {
        name = "create_emotion___create_emotion_10.0.27.tgz";
        url  = "https://registry.yarnpkg.com/create-emotion/-/create-emotion-10.0.27.tgz";
        sha1 = "cb4fa2db750f6ca6f9a001a33fbf1f6c46789503";
      };
    }
    {
      name = "create_hash___create_hash_1.2.0.tgz";
      path = fetchurl {
        name = "create_hash___create_hash_1.2.0.tgz";
        url  = "https://registry.yarnpkg.com/create-hash/-/create-hash-1.2.0.tgz";
        sha1 = "889078af11a63756bcfb59bd221996be3a9ef196";
      };
    }
    {
      name = "create_hmac___create_hmac_1.1.7.tgz";
      path = fetchurl {
        name = "create_hmac___create_hmac_1.1.7.tgz";
        url  = "https://registry.yarnpkg.com/create-hmac/-/create-hmac-1.1.7.tgz";
        sha1 = "69170c78b3ab957147b2b8b04572e47ead2243ff";
      };
    }
    {
      name = "create_react_class___create_react_class_15.6.3.tgz";
      path = fetchurl {
        name = "create_react_class___create_react_class_15.6.3.tgz";
        url  = "https://registry.yarnpkg.com/create-react-class/-/create-react-class-15.6.3.tgz";
        sha1 = "2d73237fb3f970ae6ebe011a9e66f46dbca80036";
      };
    }
    {
      name = "cross_spawn___cross_spawn_6.0.5.tgz";
      path = fetchurl {
        name = "cross_spawn___cross_spawn_6.0.5.tgz";
        url  = "https://registry.yarnpkg.com/cross-spawn/-/cross-spawn-6.0.5.tgz";
        sha1 = "4a5ec7c64dfae22c3a14124dbacdee846d80cbc4";
      };
    }
    {
      name = "cross_spawn___cross_spawn_7.0.2.tgz";
      path = fetchurl {
        name = "cross_spawn___cross_spawn_7.0.2.tgz";
        url  = "https://registry.yarnpkg.com/cross-spawn/-/cross-spawn-7.0.2.tgz";
        sha1 = "d0d7dcfa74e89115c7619f4f721a94e1fdb716d6";
      };
    }
    {
      name = "crypto_browserify___crypto_browserify_3.12.0.tgz";
      path = fetchurl {
        name = "crypto_browserify___crypto_browserify_3.12.0.tgz";
        url  = "https://registry.yarnpkg.com/crypto-browserify/-/crypto-browserify-3.12.0.tgz";
        sha1 = "396cf9f3137f03e4b8e532c58f698254e00f80ec";
      };
    }
    {
      name = "css_animation___css_animation_1.6.1.tgz";
      path = fetchurl {
        name = "css_animation___css_animation_1.6.1.tgz";
        url  = "https://registry.yarnpkg.com/css-animation/-/css-animation-1.6.1.tgz";
        sha1 = "162064a3b0d51f958b7ff37b3d6d4de18e17039e";
      };
    }
    {
      name = "css_color_names___css_color_names_0.0.4.tgz";
      path = fetchurl {
        name = "css_color_names___css_color_names_0.0.4.tgz";
        url  = "https://registry.yarnpkg.com/css-color-names/-/css-color-names-0.0.4.tgz";
        sha1 = "808adc2e79cf84738069b646cb20ec27beb629e0";
      };
    }
    {
      name = "css_declaration_sorter___css_declaration_sorter_4.0.1.tgz";
      path = fetchurl {
        name = "css_declaration_sorter___css_declaration_sorter_4.0.1.tgz";
        url  = "https://registry.yarnpkg.com/css-declaration-sorter/-/css-declaration-sorter-4.0.1.tgz";
        sha1 = "c198940f63a76d7e36c1e71018b001721054cb22";
      };
    }
    {
      name = "css_in_js_utils___css_in_js_utils_2.0.1.tgz";
      path = fetchurl {
        name = "css_in_js_utils___css_in_js_utils_2.0.1.tgz";
        url  = "https://registry.yarnpkg.com/css-in-js-utils/-/css-in-js-utils-2.0.1.tgz";
        sha1 = "3b472b398787291b47cfe3e44fecfdd9e914ba99";
      };
    }
    {
      name = "css_modules_loader_core___css_modules_loader_core_1.1.0.tgz";
      path = fetchurl {
        name = "css_modules_loader_core___css_modules_loader_core_1.1.0.tgz";
        url  = "https://registry.yarnpkg.com/css-modules-loader-core/-/css-modules-loader-core-1.1.0.tgz";
        sha1 = "5908668294a1becd261ae0a4ce21b0b551f21d16";
      };
    }
    {
      name = "css_select_base_adapter___css_select_base_adapter_0.1.1.tgz";
      path = fetchurl {
        name = "css_select_base_adapter___css_select_base_adapter_0.1.1.tgz";
        url  = "https://registry.yarnpkg.com/css-select-base-adapter/-/css-select-base-adapter-0.1.1.tgz";
        sha1 = "3b2ff4972cc362ab88561507a95408a1432135d7";
      };
    }
    {
      name = "css_select___css_select_2.1.0.tgz";
      path = fetchurl {
        name = "css_select___css_select_2.1.0.tgz";
        url  = "https://registry.yarnpkg.com/css-select/-/css-select-2.1.0.tgz";
        sha1 = "6a34653356635934a81baca68d0255432105dbef";
      };
    }
    {
      name = "css_selector_tokenizer___css_selector_tokenizer_0.7.2.tgz";
      path = fetchurl {
        name = "css_selector_tokenizer___css_selector_tokenizer_0.7.2.tgz";
        url  = "https://registry.yarnpkg.com/css-selector-tokenizer/-/css-selector-tokenizer-0.7.2.tgz";
        sha1 = "11e5e27c9a48d90284f22d45061c303d7a25ad87";
      };
    }
    {
      name = "css_tree___css_tree_1.0.0_alpha.37.tgz";
      path = fetchurl {
        name = "css_tree___css_tree_1.0.0_alpha.37.tgz";
        url  = "https://registry.yarnpkg.com/css-tree/-/css-tree-1.0.0-alpha.37.tgz";
        sha1 = "98bebd62c4c1d9f960ec340cf9f7522e30709a22";
      };
    }
    {
      name = "css_tree___css_tree_1.0.0_alpha.39.tgz";
      path = fetchurl {
        name = "css_tree___css_tree_1.0.0_alpha.39.tgz";
        url  = "https://registry.yarnpkg.com/css-tree/-/css-tree-1.0.0-alpha.39.tgz";
        sha1 = "2bff3ffe1bb3f776cf7eefd91ee5cba77a149eeb";
      };
    }
    {
      name = "css_unit_converter___css_unit_converter_1.1.1.tgz";
      path = fetchurl {
        name = "css_unit_converter___css_unit_converter_1.1.1.tgz";
        url  = "https://registry.yarnpkg.com/css-unit-converter/-/css-unit-converter-1.1.1.tgz";
        sha1 = "d9b9281adcfd8ced935bdbaba83786897f64e996";
      };
    }
    {
      name = "css_what___css_what_3.2.1.tgz";
      path = fetchurl {
        name = "css_what___css_what_3.2.1.tgz";
        url  = "https://registry.yarnpkg.com/css-what/-/css-what-3.2.1.tgz";
        sha1 = "f4a8f12421064621b456755e34a03a2c22df5da1";
      };
    }
    {
      name = "cssesc___cssesc_3.0.0.tgz";
      path = fetchurl {
        name = "cssesc___cssesc_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/cssesc/-/cssesc-3.0.0.tgz";
        sha1 = "37741919903b868565e1c09ea747445cd18983ee";
      };
    }
    {
      name = "cssnano_preset_default___cssnano_preset_default_4.0.7.tgz";
      path = fetchurl {
        name = "cssnano_preset_default___cssnano_preset_default_4.0.7.tgz";
        url  = "https://registry.yarnpkg.com/cssnano-preset-default/-/cssnano-preset-default-4.0.7.tgz";
        sha1 = "51ec662ccfca0f88b396dcd9679cdb931be17f76";
      };
    }
    {
      name = "cssnano_util_get_arguments___cssnano_util_get_arguments_4.0.0.tgz";
      path = fetchurl {
        name = "cssnano_util_get_arguments___cssnano_util_get_arguments_4.0.0.tgz";
        url  = "https://registry.yarnpkg.com/cssnano-util-get-arguments/-/cssnano-util-get-arguments-4.0.0.tgz";
        sha1 = "ed3a08299f21d75741b20f3b81f194ed49cc150f";
      };
    }
    {
      name = "cssnano_util_get_match___cssnano_util_get_match_4.0.0.tgz";
      path = fetchurl {
        name = "cssnano_util_get_match___cssnano_util_get_match_4.0.0.tgz";
        url  = "https://registry.yarnpkg.com/cssnano-util-get-match/-/cssnano-util-get-match-4.0.0.tgz";
        sha1 = "c0e4ca07f5386bb17ec5e52250b4f5961365156d";
      };
    }
    {
      name = "cssnano_util_raw_cache___cssnano_util_raw_cache_4.0.1.tgz";
      path = fetchurl {
        name = "cssnano_util_raw_cache___cssnano_util_raw_cache_4.0.1.tgz";
        url  = "https://registry.yarnpkg.com/cssnano-util-raw-cache/-/cssnano-util-raw-cache-4.0.1.tgz";
        sha1 = "b26d5fd5f72a11dfe7a7846fb4c67260f96bf282";
      };
    }
    {
      name = "cssnano_util_same_parent___cssnano_util_same_parent_4.0.1.tgz";
      path = fetchurl {
        name = "cssnano_util_same_parent___cssnano_util_same_parent_4.0.1.tgz";
        url  = "https://registry.yarnpkg.com/cssnano-util-same-parent/-/cssnano-util-same-parent-4.0.1.tgz";
        sha1 = "574082fb2859d2db433855835d9a8456ea18bbf3";
      };
    }
    {
      name = "cssnano___cssnano_4.1.10.tgz";
      path = fetchurl {
        name = "cssnano___cssnano_4.1.10.tgz";
        url  = "https://registry.yarnpkg.com/cssnano/-/cssnano-4.1.10.tgz";
        sha1 = "0ac41f0b13d13d465487e111b778d42da631b8b2";
      };
    }
    {
      name = "csso___csso_4.0.3.tgz";
      path = fetchurl {
        name = "csso___csso_4.0.3.tgz";
        url  = "https://registry.yarnpkg.com/csso/-/csso-4.0.3.tgz";
        sha1 = "0d9985dc852c7cc2b2cacfbbe1079014d1a8e903";
      };
    }
    {
      name = "cssom___cssom_0.3.8.tgz";
      path = fetchurl {
        name = "cssom___cssom_0.3.8.tgz";
        url  = "https://registry.yarnpkg.com/cssom/-/cssom-0.3.8.tgz";
        sha1 = "9f1276f5b2b463f2114d3f2c75250af8c1a36f4a";
      };
    }
    {
      name = "cssom___cssom_0.4.4.tgz";
      path = fetchurl {
        name = "cssom___cssom_0.4.4.tgz";
        url  = "https://registry.yarnpkg.com/cssom/-/cssom-0.4.4.tgz";
        sha1 = "5a66cf93d2d0b661d80bf6a44fb65f5c2e4e0a10";
      };
    }
    {
      name = "cssstyle___cssstyle_1.4.0.tgz";
      path = fetchurl {
        name = "cssstyle___cssstyle_1.4.0.tgz";
        url  = "https://registry.yarnpkg.com/cssstyle/-/cssstyle-1.4.0.tgz";
        sha1 = "9d31328229d3c565c61e586b02041a28fccdccf1";
      };
    }
    {
      name = "cssstyle___cssstyle_2.3.0.tgz";
      path = fetchurl {
        name = "cssstyle___cssstyle_2.3.0.tgz";
        url  = "https://registry.yarnpkg.com/cssstyle/-/cssstyle-2.3.0.tgz";
        sha1 = "ff665a0ddbdc31864b09647f34163443d90b0852";
      };
    }
    {
      name = "csstype___csstype_2.6.10.tgz";
      path = fetchurl {
        name = "csstype___csstype_2.6.10.tgz";
        url  = "https://registry.yarnpkg.com/csstype/-/csstype-2.6.10.tgz";
        sha1 = "e63af50e66d7c266edb6b32909cfd0aabe03928b";
      };
    }
    {
      name = "csstype___csstype_3.0.2.tgz";
      path = fetchurl {
        name = "csstype___csstype_3.0.2.tgz";
        url  = "https://registry.yarnpkg.com/csstype/-/csstype-3.0.2.tgz";
        sha1 = "ee5ff8f208c8cd613b389f7b222c9801ca62b3f7";
      };
    }
    {
      name = "d3_array___d3_array_1.2.4.tgz";
      path = fetchurl {
        name = "d3_array___d3_array_1.2.4.tgz";
        url  = "https://registry.yarnpkg.com/d3-array/-/d3-array-1.2.4.tgz";
        sha1 = "635ce4d5eea759f6f605863dbcfc30edc737f71f";
      };
    }
    {
      name = "d3_array___d3_array_2.8.0.tgz";
      path = fetchurl {
        name = "d3_array___d3_array_2.8.0.tgz";
        url  = "https://registry.yarnpkg.com/d3-array/-/d3-array-2.8.0.tgz";
        sha1 = "f76e10ad47f1f4f75f33db5fc322eb9ffde5ef23";
      };
    }
    {
      name = "d3_array___d3_array_2.4.0.tgz";
      path = fetchurl {
        name = "d3_array___d3_array_2.4.0.tgz";
        url  = "https://registry.yarnpkg.com/d3-array/-/d3-array-2.4.0.tgz";
        sha1 = "87f8b9ad11088769c82b5ea846bcb1cc9393f242";
      };
    }
    {
      name = "d3_axis___d3_axis_1.0.12.tgz";
      path = fetchurl {
        name = "d3_axis___d3_axis_1.0.12.tgz";
        url  = "https://registry.yarnpkg.com/d3-axis/-/d3-axis-1.0.12.tgz";
        sha1 = "cdf20ba210cfbb43795af33756886fb3638daac9";
      };
    }
    {
      name = "d3_brush___d3_brush_1.1.5.tgz";
      path = fetchurl {
        name = "d3_brush___d3_brush_1.1.5.tgz";
        url  = "https://registry.yarnpkg.com/d3-brush/-/d3-brush-1.1.5.tgz";
        sha1 = "066b8e84d17b192986030446c97c0fba7e1bacdc";
      };
    }
    {
      name = "d3_chord___d3_chord_1.0.6.tgz";
      path = fetchurl {
        name = "d3_chord___d3_chord_1.0.6.tgz";
        url  = "https://registry.yarnpkg.com/d3-chord/-/d3-chord-1.0.6.tgz";
        sha1 = "309157e3f2db2c752f0280fedd35f2067ccbb15f";
      };
    }
    {
      name = "d3_collection___d3_collection_1.0.7.tgz";
      path = fetchurl {
        name = "d3_collection___d3_collection_1.0.7.tgz";
        url  = "https://registry.yarnpkg.com/d3-collection/-/d3-collection-1.0.7.tgz";
        sha1 = "349bd2aa9977db071091c13144d5e4f16b5b310e";
      };
    }
    {
      name = "d3_color___d3_color_1.4.1.tgz";
      path = fetchurl {
        name = "d3_color___d3_color_1.4.1.tgz";
        url  = "https://registry.yarnpkg.com/d3-color/-/d3-color-1.4.1.tgz";
        sha1 = "c52002bf8846ada4424d55d97982fef26eb3bc8a";
      };
    }
    {
      name = "d3_color___d3_color_2.0.0.tgz";
      path = fetchurl {
        name = "d3_color___d3_color_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/d3-color/-/d3-color-2.0.0.tgz";
        sha1 = "8d625cab42ed9b8f601a1760a389f7ea9189d62e";
      };
    }
    {
      name = "d3_contour___d3_contour_1.3.2.tgz";
      path = fetchurl {
        name = "d3_contour___d3_contour_1.3.2.tgz";
        url  = "https://registry.yarnpkg.com/d3-contour/-/d3-contour-1.3.2.tgz";
        sha1 = "652aacd500d2264cb3423cee10db69f6f59bead3";
      };
    }
    {
      name = "d3_delaunay___d3_delaunay_5.2.1.tgz";
      path = fetchurl {
        name = "d3_delaunay___d3_delaunay_5.2.1.tgz";
        url  = "https://registry.yarnpkg.com/d3-delaunay/-/d3-delaunay-5.2.1.tgz";
        sha1 = "0c4b280eb00194986ac4a3df9c81d32bf216cb36";
      };
    }
    {
      name = "d3_delaunay___d3_delaunay_5.3.0.tgz";
      path = fetchurl {
        name = "d3_delaunay___d3_delaunay_5.3.0.tgz";
        url  = "https://registry.yarnpkg.com/d3-delaunay/-/d3-delaunay-5.3.0.tgz";
        sha1 = "b47f05c38f854a4e7b3cea80e0bb12e57398772d";
      };
    }
    {
      name = "d3_dispatch___d3_dispatch_1.0.6.tgz";
      path = fetchurl {
        name = "d3_dispatch___d3_dispatch_1.0.6.tgz";
        url  = "https://registry.yarnpkg.com/d3-dispatch/-/d3-dispatch-1.0.6.tgz";
        sha1 = "00d37bcee4dd8cd97729dd893a0ac29caaba5d58";
      };
    }
    {
      name = "d3_dispatch___d3_dispatch_2.0.0.tgz";
      path = fetchurl {
        name = "d3_dispatch___d3_dispatch_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/d3-dispatch/-/d3-dispatch-2.0.0.tgz";
        sha1 = "8a18e16f76dd3fcaef42163c97b926aa9b55e7cf";
      };
    }
    {
      name = "d3_drag___d3_drag_1.2.5.tgz";
      path = fetchurl {
        name = "d3_drag___d3_drag_1.2.5.tgz";
        url  = "https://registry.yarnpkg.com/d3-drag/-/d3-drag-1.2.5.tgz";
        sha1 = "2537f451acd39d31406677b7dc77c82f7d988f70";
      };
    }
    {
      name = "d3_dsv___d3_dsv_1.2.0.tgz";
      path = fetchurl {
        name = "d3_dsv___d3_dsv_1.2.0.tgz";
        url  = "https://registry.yarnpkg.com/d3-dsv/-/d3-dsv-1.2.0.tgz";
        sha1 = "9d5f75c3a5f8abd611f74d3f5847b0d4338b885c";
      };
    }
    {
      name = "d3_dsv___d3_dsv_2.0.0.tgz";
      path = fetchurl {
        name = "d3_dsv___d3_dsv_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/d3-dsv/-/d3-dsv-2.0.0.tgz";
        sha1 = "b37b194b6df42da513a120d913ad1be22b5fe7c5";
      };
    }
    {
      name = "d3_ease___d3_ease_1.0.6.tgz";
      path = fetchurl {
        name = "d3_ease___d3_ease_1.0.6.tgz";
        url  = "https://registry.yarnpkg.com/d3-ease/-/d3-ease-1.0.6.tgz";
        sha1 = "ebdb6da22dfac0a22222f2d4da06f66c416a0ec0";
      };
    }
    {
      name = "d3_fetch___d3_fetch_1.1.2.tgz";
      path = fetchurl {
        name = "d3_fetch___d3_fetch_1.1.2.tgz";
        url  = "https://registry.yarnpkg.com/d3-fetch/-/d3-fetch-1.1.2.tgz";
        sha1 = "957c8fbc6d4480599ba191b1b2518bf86b3e1be2";
      };
    }
    {
      name = "d3_force___d3_force_1.2.1.tgz";
      path = fetchurl {
        name = "d3_force___d3_force_1.2.1.tgz";
        url  = "https://registry.yarnpkg.com/d3-force/-/d3-force-1.2.1.tgz";
        sha1 = "fd29a5d1ff181c9e7f0669e4bd72bdb0e914ec0b";
      };
    }
    {
      name = "d3_force___d3_force_2.0.1.tgz";
      path = fetchurl {
        name = "d3_force___d3_force_2.0.1.tgz";
        url  = "https://registry.yarnpkg.com/d3-force/-/d3-force-2.0.1.tgz";
        sha1 = "31750eee8c43535301d571195bf9683beda534e2";
      };
    }
    {
      name = "d3_force___d3_force_2.1.1.tgz";
      path = fetchurl {
        name = "d3_force___d3_force_2.1.1.tgz";
        url  = "https://registry.yarnpkg.com/d3-force/-/d3-force-2.1.1.tgz";
        sha1 = "f20ccbf1e6c9e80add1926f09b51f686a8bc0937";
      };
    }
    {
      name = "d3_format___d3_format_1.4.4.tgz";
      path = fetchurl {
        name = "d3_format___d3_format_1.4.4.tgz";
        url  = "https://registry.yarnpkg.com/d3-format/-/d3-format-1.4.4.tgz";
        sha1 = "356925f28d0fd7c7983bfad593726fce46844030";
      };
    }
    {
      name = "d3_format___d3_format_2.0.0.tgz";
      path = fetchurl {
        name = "d3_format___d3_format_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/d3-format/-/d3-format-2.0.0.tgz";
        sha1 = "a10bcc0f986c372b729ba447382413aabf5b0767";
      };
    }
    {
      name = "d3_geo_projection___d3_geo_projection_2.9.0.tgz";
      path = fetchurl {
        name = "d3_geo_projection___d3_geo_projection_2.9.0.tgz";
        url  = "https://registry.yarnpkg.com/d3-geo-projection/-/d3-geo-projection-2.9.0.tgz";
        sha1 = "826db62f748e8ecd67cd00aced4c26a236ec030c";
      };
    }
    {
      name = "d3_geo_projection___d3_geo_projection_3.0.0.tgz";
      path = fetchurl {
        name = "d3_geo_projection___d3_geo_projection_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/d3-geo-projection/-/d3-geo-projection-3.0.0.tgz";
        sha1 = "45ad8ce756cdbfa8340b11b2988644d8e1fa42e4";
      };
    }
    {
      name = "d3_geo___d3_geo_1.12.0.tgz";
      path = fetchurl {
        name = "d3_geo___d3_geo_1.12.0.tgz";
        url  = "https://registry.yarnpkg.com/d3-geo/-/d3-geo-1.12.0.tgz";
        sha1 = "58ddbdf4d9db5f199db69d1b7c93dca6454a6f24";
      };
    }
    {
      name = "d3_geo___d3_geo_2.0.1.tgz";
      path = fetchurl {
        name = "d3_geo___d3_geo_2.0.1.tgz";
        url  = "https://registry.yarnpkg.com/d3-geo/-/d3-geo-2.0.1.tgz";
        sha1 = "2437fdfed3fe3aba2812bd8f30609cac83a7ee39";
      };
    }
    {
      name = "d3_hierarchy___d3_hierarchy_1.1.9.tgz";
      path = fetchurl {
        name = "d3_hierarchy___d3_hierarchy_1.1.9.tgz";
        url  = "https://registry.yarnpkg.com/d3-hierarchy/-/d3-hierarchy-1.1.9.tgz";
        sha1 = "2f6bee24caaea43f8dc37545fa01628559647a83";
      };
    }
    {
      name = "d3_hierarchy___d3_hierarchy_2.0.0.tgz";
      path = fetchurl {
        name = "d3_hierarchy___d3_hierarchy_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/d3-hierarchy/-/d3-hierarchy-2.0.0.tgz";
        sha1 = "dab88a58ca3e7a1bc6cab390e89667fcc6d20218";
      };
    }
    {
      name = "d3_interpolate___d3_interpolate_1.4.0.tgz";
      path = fetchurl {
        name = "d3_interpolate___d3_interpolate_1.4.0.tgz";
        url  = "https://registry.yarnpkg.com/d3-interpolate/-/d3-interpolate-1.4.0.tgz";
        sha1 = "526e79e2d80daa383f9e0c1c1c7dcc0f0583e987";
      };
    }
    {
      name = "d3_interpolate___d3_interpolate_2.0.1.tgz";
      path = fetchurl {
        name = "d3_interpolate___d3_interpolate_2.0.1.tgz";
        url  = "https://registry.yarnpkg.com/d3-interpolate/-/d3-interpolate-2.0.1.tgz";
        sha1 = "98be499cfb8a3b94d4ff616900501a64abc91163";
      };
    }
    {
      name = "d3_path___d3_path_1.0.9.tgz";
      path = fetchurl {
        name = "d3_path___d3_path_1.0.9.tgz";
        url  = "https://registry.yarnpkg.com/d3-path/-/d3-path-1.0.9.tgz";
        sha1 = "48c050bb1fe8c262493a8caf5524e3e9591701cf";
      };
    }
    {
      name = "d3_path___d3_path_2.0.0.tgz";
      path = fetchurl {
        name = "d3_path___d3_path_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/d3-path/-/d3-path-2.0.0.tgz";
        sha1 = "55d86ac131a0548adae241eebfb56b4582dd09d8";
      };
    }
    {
      name = "d3_polygon___d3_polygon_1.0.6.tgz";
      path = fetchurl {
        name = "d3_polygon___d3_polygon_1.0.6.tgz";
        url  = "https://registry.yarnpkg.com/d3-polygon/-/d3-polygon-1.0.6.tgz";
        sha1 = "0bf8cb8180a6dc107f518ddf7975e12abbfbd38e";
      };
    }
    {
      name = "d3_quadtree___d3_quadtree_1.0.7.tgz";
      path = fetchurl {
        name = "d3_quadtree___d3_quadtree_1.0.7.tgz";
        url  = "https://registry.yarnpkg.com/d3-quadtree/-/d3-quadtree-1.0.7.tgz";
        sha1 = "ca8b84df7bb53763fe3c2f24bd435137f4e53135";
      };
    }
    {
      name = "d3_quadtree___d3_quadtree_2.0.0.tgz";
      path = fetchurl {
        name = "d3_quadtree___d3_quadtree_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/d3-quadtree/-/d3-quadtree-2.0.0.tgz";
        sha1 = "edbad045cef88701f6fee3aee8e93fb332d30f9d";
      };
    }
    {
      name = "d3_random___d3_random_1.1.2.tgz";
      path = fetchurl {
        name = "d3_random___d3_random_1.1.2.tgz";
        url  = "https://registry.yarnpkg.com/d3-random/-/d3-random-1.1.2.tgz";
        sha1 = "2833be7c124360bf9e2d3fd4f33847cfe6cab291";
      };
    }
    {
      name = "d3_scale_chromatic___d3_scale_chromatic_1.5.0.tgz";
      path = fetchurl {
        name = "d3_scale_chromatic___d3_scale_chromatic_1.5.0.tgz";
        url  = "https://registry.yarnpkg.com/d3-scale-chromatic/-/d3-scale-chromatic-1.5.0.tgz";
        sha1 = "54e333fc78212f439b14641fb55801dd81135a98";
      };
    }
    {
      name = "d3_scale___d3_scale_2.2.2.tgz";
      path = fetchurl {
        name = "d3_scale___d3_scale_2.2.2.tgz";
        url  = "https://registry.yarnpkg.com/d3-scale/-/d3-scale-2.2.2.tgz";
        sha1 = "4e880e0b2745acaaddd3ede26a9e908a9e17b81f";
      };
    }
    {
      name = "d3_scale___d3_scale_3.2.1.tgz";
      path = fetchurl {
        name = "d3_scale___d3_scale_3.2.1.tgz";
        url  = "https://registry.yarnpkg.com/d3-scale/-/d3-scale-3.2.1.tgz";
        sha1 = "da1684adce7261b4bc7a76fe193d887f0e909e69";
      };
    }
    {
      name = "d3_scale___d3_scale_3.2.3.tgz";
      path = fetchurl {
        name = "d3_scale___d3_scale_3.2.3.tgz";
        url  = "https://registry.yarnpkg.com/d3-scale/-/d3-scale-3.2.3.tgz";
        sha1 = "be380f57f1f61d4ff2e6cbb65a40593a51649cfd";
      };
    }
    {
      name = "d3_selection___d3_selection_1.4.1.tgz";
      path = fetchurl {
        name = "d3_selection___d3_selection_1.4.1.tgz";
        url  = "https://registry.yarnpkg.com/d3-selection/-/d3-selection-1.4.1.tgz";
        sha1 = "98eedbbe085fbda5bafa2f9e3f3a2f4d7d622a98";
      };
    }
    {
      name = "d3_shape___d3_shape_1.3.7.tgz";
      path = fetchurl {
        name = "d3_shape___d3_shape_1.3.7.tgz";
        url  = "https://registry.yarnpkg.com/d3-shape/-/d3-shape-1.3.7.tgz";
        sha1 = "df63801be07bc986bc54f63789b4fe502992b5d7";
      };
    }
    {
      name = "d3_shape___d3_shape_2.0.0.tgz";
      path = fetchurl {
        name = "d3_shape___d3_shape_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/d3-shape/-/d3-shape-2.0.0.tgz";
        sha1 = "2331b62fa784a2a1daac47a7233cfd69301381fd";
      };
    }
    {
      name = "d3_time_format___d3_time_format_2.2.3.tgz";
      path = fetchurl {
        name = "d3_time_format___d3_time_format_2.2.3.tgz";
        url  = "https://registry.yarnpkg.com/d3-time-format/-/d3-time-format-2.2.3.tgz";
        sha1 = "0c9a12ee28342b2037e5ea1cf0b9eb4dd75f29cb";
      };
    }
    {
      name = "d3_time_format___d3_time_format_3.0.0.tgz";
      path = fetchurl {
        name = "d3_time_format___d3_time_format_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/d3-time-format/-/d3-time-format-3.0.0.tgz";
        sha1 = "df8056c83659e01f20ac5da5fdeae7c08d5f1bb6";
      };
    }
    {
      name = "d3_time___d3_time_1.1.0.tgz";
      path = fetchurl {
        name = "d3_time___d3_time_1.1.0.tgz";
        url  = "https://registry.yarnpkg.com/d3-time/-/d3-time-1.1.0.tgz";
        sha1 = "b1e19d307dae9c900b7e5b25ffc5dcc249a8a0f1";
      };
    }
    {
      name = "d3_time___d3_time_2.0.0.tgz";
      path = fetchurl {
        name = "d3_time___d3_time_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/d3-time/-/d3-time-2.0.0.tgz";
        sha1 = "ad7c127d17c67bd57a4c61f3eaecb81108b1e0ab";
      };
    }
    {
      name = "d3_timer___d3_timer_1.0.10.tgz";
      path = fetchurl {
        name = "d3_timer___d3_timer_1.0.10.tgz";
        url  = "https://registry.yarnpkg.com/d3-timer/-/d3-timer-1.0.10.tgz";
        sha1 = "dfe76b8a91748831b13b6d9c793ffbd508dd9de5";
      };
    }
    {
      name = "d3_timer___d3_timer_2.0.0.tgz";
      path = fetchurl {
        name = "d3_timer___d3_timer_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/d3-timer/-/d3-timer-2.0.0.tgz";
        sha1 = "055edb1d170cfe31ab2da8968deee940b56623e6";
      };
    }
    {
      name = "d3_transition___d3_transition_1.3.2.tgz";
      path = fetchurl {
        name = "d3_transition___d3_transition_1.3.2.tgz";
        url  = "https://registry.yarnpkg.com/d3-transition/-/d3-transition-1.3.2.tgz";
        sha1 = "a98ef2151be8d8600543434c1ca80140ae23b398";
      };
    }
    {
      name = "d3_voronoi___d3_voronoi_1.1.4.tgz";
      path = fetchurl {
        name = "d3_voronoi___d3_voronoi_1.1.4.tgz";
        url  = "https://registry.yarnpkg.com/d3-voronoi/-/d3-voronoi-1.1.4.tgz";
        sha1 = "dd3c78d7653d2bb359284ae478645d95944c8297";
      };
    }
    {
      name = "d3_zoom___d3_zoom_1.8.3.tgz";
      path = fetchurl {
        name = "d3_zoom___d3_zoom_1.8.3.tgz";
        url  = "https://registry.yarnpkg.com/d3-zoom/-/d3-zoom-1.8.3.tgz";
        sha1 = "b6a3dbe738c7763121cd05b8a7795ffe17f4fc0a";
      };
    }
    {
      name = "d3___d3_5.15.0.tgz";
      path = fetchurl {
        name = "d3___d3_5.15.0.tgz";
        url  = "https://registry.yarnpkg.com/d3/-/d3-5.15.0.tgz";
        sha1 = "ffd44958e6a3cb8a59a84429c45429b8bca5677a";
      };
    }
    {
      name = "d3___d3_5.16.0.tgz";
      path = fetchurl {
        name = "d3___d3_5.16.0.tgz";
        url  = "https://registry.yarnpkg.com/d3/-/d3-5.16.0.tgz";
        sha1 = "9c5e8d3b56403c79d4ed42fbd62f6113f199c877";
      };
    }
    {
      name = "dashdash___dashdash_1.14.1.tgz";
      path = fetchurl {
        name = "dashdash___dashdash_1.14.1.tgz";
        url  = "https://registry.yarnpkg.com/dashdash/-/dashdash-1.14.1.tgz";
        sha1 = "853cfa0f7cbe2fed5de20326b8dd581035f6e2f0";
      };
    }
    {
      name = "data_urls___data_urls_1.1.0.tgz";
      path = fetchurl {
        name = "data_urls___data_urls_1.1.0.tgz";
        url  = "https://registry.yarnpkg.com/data-urls/-/data-urls-1.1.0.tgz";
        sha1 = "15ee0582baa5e22bb59c77140da8f9c76963bbfe";
      };
    }
    {
      name = "deasync___deasync_0.1.20.tgz";
      path = fetchurl {
        name = "deasync___deasync_0.1.20.tgz";
        url  = "https://registry.yarnpkg.com/deasync/-/deasync-0.1.20.tgz";
        sha1 = "546fd2660688a1eeed55edce2308c5cf7104f9da";
      };
    }
    {
      name = "debug___debug_2.6.9.tgz";
      path = fetchurl {
        name = "debug___debug_2.6.9.tgz";
        url  = "https://registry.yarnpkg.com/debug/-/debug-2.6.9.tgz";
        sha1 = "5d128515df134ff327e90a4c93f4e077a536341f";
      };
    }
    {
      name = "debug___debug_4.1.1.tgz";
      path = fetchurl {
        name = "debug___debug_4.1.1.tgz";
        url  = "https://registry.yarnpkg.com/debug/-/debug-4.1.1.tgz";
        sha1 = "3b72260255109c6b589cee050f1d516139664791";
      };
    }
    {
      name = "decamelize___decamelize_1.2.0.tgz";
      path = fetchurl {
        name = "decamelize___decamelize_1.2.0.tgz";
        url  = "https://registry.yarnpkg.com/decamelize/-/decamelize-1.2.0.tgz";
        sha1 = "f6534d15148269b20352e7bee26f501f9a191290";
      };
    }
    {
      name = "decimal.js___decimal.js_10.2.0.tgz";
      path = fetchurl {
        name = "decimal.js___decimal.js_10.2.0.tgz";
        url  = "https://registry.yarnpkg.com/decimal.js/-/decimal.js-10.2.0.tgz";
        sha1 = "39466113a9e036111d02f82489b5fd6b0b5ed231";
      };
    }
    {
      name = "decode_uri_component___decode_uri_component_0.2.0.tgz";
      path = fetchurl {
        name = "decode_uri_component___decode_uri_component_0.2.0.tgz";
        url  = "https://registry.yarnpkg.com/decode-uri-component/-/decode-uri-component-0.2.0.tgz";
        sha1 = "eb3913333458775cb84cd1a1fae062106bb87545";
      };
    }
    {
      name = "deep_eql___deep_eql_0.1.3.tgz";
      path = fetchurl {
        name = "deep_eql___deep_eql_0.1.3.tgz";
        url  = "https://registry.yarnpkg.com/deep-eql/-/deep-eql-0.1.3.tgz";
        sha1 = "ef558acab8de25206cd713906d74e56930eb69f2";
      };
    }
    {
      name = "deep_is___deep_is_0.1.3.tgz";
      path = fetchurl {
        name = "deep_is___deep_is_0.1.3.tgz";
        url  = "https://registry.yarnpkg.com/deep-is/-/deep-is-0.1.3.tgz";
        sha1 = "b369d6fb5dbc13eecf524f91b070feedc357cf34";
      };
    }
    {
      name = "deepmerge___deepmerge_4.2.2.tgz";
      path = fetchurl {
        name = "deepmerge___deepmerge_4.2.2.tgz";
        url  = "https://registry.yarnpkg.com/deepmerge/-/deepmerge-4.2.2.tgz";
        sha1 = "44d2ea3679b8f4d4ffba33f03d865fc1e7bf4955";
      };
    }
    {
      name = "defaults___defaults_1.0.3.tgz";
      path = fetchurl {
        name = "defaults___defaults_1.0.3.tgz";
        url  = "https://registry.yarnpkg.com/defaults/-/defaults-1.0.3.tgz";
        sha1 = "c656051e9817d9ff08ed881477f3fe4019f3ef7d";
      };
    }
    {
      name = "define_properties___define_properties_1.1.3.tgz";
      path = fetchurl {
        name = "define_properties___define_properties_1.1.3.tgz";
        url  = "https://registry.yarnpkg.com/define-properties/-/define-properties-1.1.3.tgz";
        sha1 = "cf88da6cbee26fe6db7094f61d870cbd84cee9f1";
      };
    }
    {
      name = "define_property___define_property_0.2.5.tgz";
      path = fetchurl {
        name = "define_property___define_property_0.2.5.tgz";
        url  = "https://registry.yarnpkg.com/define-property/-/define-property-0.2.5.tgz";
        sha1 = "c35b1ef918ec3c990f9a5bc57be04aacec5c8116";
      };
    }
    {
      name = "define_property___define_property_1.0.0.tgz";
      path = fetchurl {
        name = "define_property___define_property_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/define-property/-/define-property-1.0.0.tgz";
        sha1 = "769ebaaf3f4a63aad3af9e8d304c9bbe79bfb0e6";
      };
    }
    {
      name = "define_property___define_property_2.0.2.tgz";
      path = fetchurl {
        name = "define_property___define_property_2.0.2.tgz";
        url  = "https://registry.yarnpkg.com/define-property/-/define-property-2.0.2.tgz";
        sha1 = "d459689e8d654ba77e02a817f8710d702cb16e9d";
      };
    }
    {
      name = "defined___defined_1.0.0.tgz";
      path = fetchurl {
        name = "defined___defined_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/defined/-/defined-1.0.0.tgz";
        sha1 = "c98d9bcef75674188e110969151199e39b1fa693";
      };
    }
    {
      name = "delaunator___delaunator_4.0.1.tgz";
      path = fetchurl {
        name = "delaunator___delaunator_4.0.1.tgz";
        url  = "https://registry.yarnpkg.com/delaunator/-/delaunator-4.0.1.tgz";
        sha1 = "3d779687f57919a7a418f8ab947d3bddb6846957";
      };
    }
    {
      name = "delayed_stream___delayed_stream_1.0.0.tgz";
      path = fetchurl {
        name = "delayed_stream___delayed_stream_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/delayed-stream/-/delayed-stream-1.0.0.tgz";
        sha1 = "df3ae199acadfb7d440aaae0b29e2272b24ec619";
      };
    }
    {
      name = "depd___depd_1.1.2.tgz";
      path = fetchurl {
        name = "depd___depd_1.1.2.tgz";
        url  = "https://registry.yarnpkg.com/depd/-/depd-1.1.2.tgz";
        sha1 = "9bcd52e14c097763e749b274c4346ed2e560b5a9";
      };
    }
    {
      name = "dependency_graph___dependency_graph_0.8.1.tgz";
      path = fetchurl {
        name = "dependency_graph___dependency_graph_0.8.1.tgz";
        url  = "https://registry.yarnpkg.com/dependency-graph/-/dependency-graph-0.8.1.tgz";
        sha1 = "9b8cae3aa2c7bd95ccb3347a09a2d1047a6c3c5a";
      };
    }
    {
      name = "des.js___des.js_1.0.1.tgz";
      path = fetchurl {
        name = "des.js___des.js_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/des.js/-/des.js-1.0.1.tgz";
        sha1 = "5382142e1bdc53f85d86d53e5f4aa7deb91e0843";
      };
    }
    {
      name = "destroy___destroy_1.0.4.tgz";
      path = fetchurl {
        name = "destroy___destroy_1.0.4.tgz";
        url  = "https://registry.yarnpkg.com/destroy/-/destroy-1.0.4.tgz";
        sha1 = "978857442c44749e4206613e37946205826abd80";
      };
    }
    {
      name = "detect_newline___detect_newline_3.1.0.tgz";
      path = fetchurl {
        name = "detect_newline___detect_newline_3.1.0.tgz";
        url  = "https://registry.yarnpkg.com/detect-newline/-/detect-newline-3.1.0.tgz";
        sha1 = "576f5dfc63ae1a192ff192d8ad3af6308991b651";
      };
    }
    {
      name = "detective___detective_5.2.0.tgz";
      path = fetchurl {
        name = "detective___detective_5.2.0.tgz";
        url  = "https://registry.yarnpkg.com/detective/-/detective-5.2.0.tgz";
        sha1 = "feb2a77e85b904ecdea459ad897cc90a99bd2a7b";
      };
    }
    {
      name = "diff_match_patch___diff_match_patch_1.0.5.tgz";
      path = fetchurl {
        name = "diff_match_patch___diff_match_patch_1.0.5.tgz";
        url  = "https://registry.yarnpkg.com/diff-match-patch/-/diff-match-patch-1.0.5.tgz";
        sha1 = "abb584d5f10cd1196dfc55aa03701592ae3f7b37";
      };
    }
    {
      name = "diff_sequences___diff_sequences_25.2.6.tgz";
      path = fetchurl {
        name = "diff_sequences___diff_sequences_25.2.6.tgz";
        url  = "https://registry.yarnpkg.com/diff-sequences/-/diff-sequences-25.2.6.tgz";
        sha1 = "5f467c00edd35352b7bca46d7927d60e687a76dd";
      };
    }
    {
      name = "diffie_hellman___diffie_hellman_5.0.3.tgz";
      path = fetchurl {
        name = "diffie_hellman___diffie_hellman_5.0.3.tgz";
        url  = "https://registry.yarnpkg.com/diffie-hellman/-/diffie-hellman-5.0.3.tgz";
        sha1 = "40e8ee98f55a2149607146921c63e1ae5f3d2875";
      };
    }
    {
      name = "dir_glob___dir_glob_3.0.1.tgz";
      path = fetchurl {
        name = "dir_glob___dir_glob_3.0.1.tgz";
        url  = "https://registry.yarnpkg.com/dir-glob/-/dir-glob-3.0.1.tgz";
        sha1 = "56dbf73d992a4a93ba1584f4534063fd2e41717f";
      };
    }
    {
      name = "discrete_sampling___discrete_sampling_1.0.3.tgz";
      path = fetchurl {
        name = "discrete_sampling___discrete_sampling_1.0.3.tgz";
        url  = "https://registry.yarnpkg.com/discrete-sampling/-/discrete-sampling-1.0.3.tgz";
        sha1 = "43311aa36782647006ae5bf87d8dad0a470b5d15";
      };
    }
    {
      name = "docsify___docsify_4.12.2.tgz";
      path = fetchurl {
        name = "docsify___docsify_4.12.2.tgz";
        url  = "https://registry.yarnpkg.com/docsify/-/docsify-4.12.2.tgz";
        sha1 = "749115d2ff7d358780ea865e01f4a0162423d67f";
      };
    }
    {
      name = "dom_align___dom_align_1.11.1.tgz";
      path = fetchurl {
        name = "dom_align___dom_align_1.11.1.tgz";
        url  = "https://registry.yarnpkg.com/dom-align/-/dom-align-1.11.1.tgz";
        sha1 = "7592be99a660a36cdedc1d6eeb22b8109d758cae";
      };
    }
    {
      name = "dom_closest___dom_closest_0.2.0.tgz";
      path = fetchurl {
        name = "dom_closest___dom_closest_0.2.0.tgz";
        url  = "https://registry.yarnpkg.com/dom-closest/-/dom-closest-0.2.0.tgz";
        sha1 = "ebd9f91d1bf22e8d6f477876bbcd3ec90216c0cf";
      };
    }
    {
      name = "dom_matches___dom_matches_2.0.0.tgz";
      path = fetchurl {
        name = "dom_matches___dom_matches_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/dom-matches/-/dom-matches-2.0.0.tgz";
        sha1 = "d2728b416a87533980eb089b848d253cf23a758c";
      };
    }
    {
      name = "dom_scroll_into_view___dom_scroll_into_view_1.2.1.tgz";
      path = fetchurl {
        name = "dom_scroll_into_view___dom_scroll_into_view_1.2.1.tgz";
        url  = "https://registry.yarnpkg.com/dom-scroll-into-view/-/dom-scroll-into-view-1.2.1.tgz";
        sha1 = "e8f36732dd089b0201a88d7815dc3f88e6d66c7e";
      };
    }
    {
      name = "dom_serializer___dom_serializer_0.2.2.tgz";
      path = fetchurl {
        name = "dom_serializer___dom_serializer_0.2.2.tgz";
        url  = "https://registry.yarnpkg.com/dom-serializer/-/dom-serializer-0.2.2.tgz";
        sha1 = "1afb81f533717175d478655debc5e332d9f9bb51";
      };
    }
    {
      name = "domain_browser___domain_browser_1.2.0.tgz";
      path = fetchurl {
        name = "domain_browser___domain_browser_1.2.0.tgz";
        url  = "https://registry.yarnpkg.com/domain-browser/-/domain-browser-1.2.0.tgz";
        sha1 = "3d31f50191a6749dd1375a7f522e823d42e54eda";
      };
    }
    {
      name = "domelementtype___domelementtype_1.3.1.tgz";
      path = fetchurl {
        name = "domelementtype___domelementtype_1.3.1.tgz";
        url  = "https://registry.yarnpkg.com/domelementtype/-/domelementtype-1.3.1.tgz";
        sha1 = "d048c44b37b0d10a7f2a3d5fee3f4333d790481f";
      };
    }
    {
      name = "domelementtype___domelementtype_2.0.1.tgz";
      path = fetchurl {
        name = "domelementtype___domelementtype_2.0.1.tgz";
        url  = "https://registry.yarnpkg.com/domelementtype/-/domelementtype-2.0.1.tgz";
        sha1 = "1f8bdfe91f5a78063274e803b4bdcedf6e94f94d";
      };
    }
    {
      name = "domexception___domexception_1.0.1.tgz";
      path = fetchurl {
        name = "domexception___domexception_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/domexception/-/domexception-1.0.1.tgz";
        sha1 = "937442644ca6a31261ef36e3ec677fe805582c90";
      };
    }
    {
      name = "domhandler___domhandler_2.4.2.tgz";
      path = fetchurl {
        name = "domhandler___domhandler_2.4.2.tgz";
        url  = "https://registry.yarnpkg.com/domhandler/-/domhandler-2.4.2.tgz";
        sha1 = "8805097e933d65e85546f726d60f5eb88b44f803";
      };
    }
    {
      name = "dompurify___dompurify_2.3.4.tgz";
      path = fetchurl {
        name = "dompurify___dompurify_2.3.4.tgz";
        url  = "https://registry.yarnpkg.com/dompurify/-/dompurify-2.3.4.tgz";
        sha1 = "1cf5cf0105ccb4debdf6db162525bd41e6ddacc6";
      };
    }
    {
      name = "domutils___domutils_1.7.0.tgz";
      path = fetchurl {
        name = "domutils___domutils_1.7.0.tgz";
        url  = "https://registry.yarnpkg.com/domutils/-/domutils-1.7.0.tgz";
        sha1 = "56ea341e834e06e6748af7a1cb25da67ea9f8c2a";
      };
    }
    {
      name = "dot_prop___dot_prop_5.2.0.tgz";
      path = fetchurl {
        name = "dot_prop___dot_prop_5.2.0.tgz";
        url  = "https://registry.yarnpkg.com/dot-prop/-/dot-prop-5.2.0.tgz";
        sha1 = "c34ecc29556dc45f1f4c22697b6f4904e0cc4fcb";
      };
    }
    {
      name = "dotenv_expand___dotenv_expand_4.2.0.tgz";
      path = fetchurl {
        name = "dotenv_expand___dotenv_expand_4.2.0.tgz";
        url  = "https://registry.yarnpkg.com/dotenv-expand/-/dotenv-expand-4.2.0.tgz";
        sha1 = "def1f1ca5d6059d24a766e587942c21106ce1275";
      };
    }
    {
      name = "dotenv_expand___dotenv_expand_5.1.0.tgz";
      path = fetchurl {
        name = "dotenv_expand___dotenv_expand_5.1.0.tgz";
        url  = "https://registry.yarnpkg.com/dotenv-expand/-/dotenv-expand-5.1.0.tgz";
        sha1 = "3fbaf020bfd794884072ea26b1e9791d45a629f0";
      };
    }
    {
      name = "dotenv___dotenv_5.0.1.tgz";
      path = fetchurl {
        name = "dotenv___dotenv_5.0.1.tgz";
        url  = "https://registry.yarnpkg.com/dotenv/-/dotenv-5.0.1.tgz";
        sha1 = "a5317459bd3d79ab88cff6e44057a6a3fbb1fcef";
      };
    }
    {
      name = "draft_js___draft_js_0.10.5.tgz";
      path = fetchurl {
        name = "draft_js___draft_js_0.10.5.tgz";
        url  = "https://registry.yarnpkg.com/draft-js/-/draft-js-0.10.5.tgz";
        sha1 = "bfa9beb018fe0533dbb08d6675c371a6b08fa742";
      };
    }
    {
      name = "duplexer2___duplexer2_0.1.4.tgz";
      path = fetchurl {
        name = "duplexer2___duplexer2_0.1.4.tgz";
        url  = "https://registry.yarnpkg.com/duplexer2/-/duplexer2-0.1.4.tgz";
        sha1 = "8b12dab878c0d69e3e7891051662a32fc6bddcc1";
      };
    }
    {
      name = "duplexer___duplexer_0.1.1.tgz";
      path = fetchurl {
        name = "duplexer___duplexer_0.1.1.tgz";
        url  = "https://registry.yarnpkg.com/duplexer/-/duplexer-0.1.1.tgz";
        sha1 = "ace6ff808c1ce66b57d1ebf97977acb02334cfc1";
      };
    }
    {
      name = "ecc_jsbn___ecc_jsbn_0.1.2.tgz";
      path = fetchurl {
        name = "ecc_jsbn___ecc_jsbn_0.1.2.tgz";
        url  = "https://registry.yarnpkg.com/ecc-jsbn/-/ecc-jsbn-0.1.2.tgz";
        sha1 = "3a83a904e54353287874c564b7549386849a98c9";
      };
    }
    {
      name = "editorconfig___editorconfig_0.15.3.tgz";
      path = fetchurl {
        name = "editorconfig___editorconfig_0.15.3.tgz";
        url  = "https://registry.yarnpkg.com/editorconfig/-/editorconfig-0.15.3.tgz";
        sha1 = "bef84c4e75fb8dcb0ce5cee8efd51c15999befc5";
      };
    }
    {
      name = "ee_first___ee_first_1.1.1.tgz";
      path = fetchurl {
        name = "ee_first___ee_first_1.1.1.tgz";
        url  = "https://registry.yarnpkg.com/ee-first/-/ee-first-1.1.1.tgz";
        sha1 = "590c61156b0ae2f4f0255732a158b266bc56b21d";
      };
    }
    {
      name = "electron_to_chromium___electron_to_chromium_1.3.425.tgz";
      path = fetchurl {
        name = "electron_to_chromium___electron_to_chromium_1.3.425.tgz";
        url  = "https://registry.yarnpkg.com/electron-to-chromium/-/electron-to-chromium-1.3.425.tgz";
        sha1 = "96b7b5aa9115e42baf59be88d2432c9f406128c4";
      };
    }
    {
      name = "elliptic___elliptic_6.5.2.tgz";
      path = fetchurl {
        name = "elliptic___elliptic_6.5.2.tgz";
        url  = "https://registry.yarnpkg.com/elliptic/-/elliptic-6.5.2.tgz";
        sha1 = "05c5678d7173c049d8ca433552224a495d0e3762";
      };
    }
    {
      name = "email_addresses___email_addresses_3.1.0.tgz";
      path = fetchurl {
        name = "email_addresses___email_addresses_3.1.0.tgz";
        url  = "https://registry.yarnpkg.com/email-addresses/-/email-addresses-3.1.0.tgz";
        sha1 = "cabf7e085cbdb63008a70319a74e6136188812fb";
      };
    }
    {
      name = "emoji_regex___emoji_regex_7.0.3.tgz";
      path = fetchurl {
        name = "emoji_regex___emoji_regex_7.0.3.tgz";
        url  = "https://registry.yarnpkg.com/emoji-regex/-/emoji-regex-7.0.3.tgz";
        sha1 = "933a04052860c85e83c122479c4748a8e4c72156";
      };
    }
    {
      name = "emoji_regex___emoji_regex_8.0.0.tgz";
      path = fetchurl {
        name = "emoji_regex___emoji_regex_8.0.0.tgz";
        url  = "https://registry.yarnpkg.com/emoji-regex/-/emoji-regex-8.0.0.tgz";
        sha1 = "e818fd69ce5ccfcb404594f842963bf53164cc37";
      };
    }
    {
      name = "emotion___emotion_10.0.27.tgz";
      path = fetchurl {
        name = "emotion___emotion_10.0.27.tgz";
        url  = "https://registry.yarnpkg.com/emotion/-/emotion-10.0.27.tgz";
        sha1 = "f9ca5df98630980a23c819a56262560562e5d75e";
      };
    }
    {
      name = "encodeurl___encodeurl_1.0.2.tgz";
      path = fetchurl {
        name = "encodeurl___encodeurl_1.0.2.tgz";
        url  = "https://registry.yarnpkg.com/encodeurl/-/encodeurl-1.0.2.tgz";
        sha1 = "ad3ff4c86ec2d029322f5a02c3a9a606c95b3f59";
      };
    }
    {
      name = "encoding___encoding_0.1.12.tgz";
      path = fetchurl {
        name = "encoding___encoding_0.1.12.tgz";
        url  = "https://registry.yarnpkg.com/encoding/-/encoding-0.1.12.tgz";
        sha1 = "538b66f3ee62cd1ab51ec323829d1f9480c74beb";
      };
    }
    {
      name = "end_of_stream___end_of_stream_1.4.4.tgz";
      path = fetchurl {
        name = "end_of_stream___end_of_stream_1.4.4.tgz";
        url  = "https://registry.yarnpkg.com/end-of-stream/-/end-of-stream-1.4.4.tgz";
        sha1 = "5ae64a5f45057baf3626ec14da0ca5e4b2431eb0";
      };
    }
    {
      name = "enquire.js___enquire.js_2.1.6.tgz";
      path = fetchurl {
        name = "enquire.js___enquire.js_2.1.6.tgz";
        url  = "https://registry.yarnpkg.com/enquire.js/-/enquire.js-2.1.6.tgz";
        sha1 = "3e8780c9b8b835084c3f60e166dbc3c2a3c89814";
      };
    }
    {
      name = "entities___entities_1.1.2.tgz";
      path = fetchurl {
        name = "entities___entities_1.1.2.tgz";
        url  = "https://registry.yarnpkg.com/entities/-/entities-1.1.2.tgz";
        sha1 = "bdfa735299664dfafd34529ed4f8522a275fea56";
      };
    }
    {
      name = "entities___entities_2.0.0.tgz";
      path = fetchurl {
        name = "entities___entities_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/entities/-/entities-2.0.0.tgz";
        sha1 = "68d6084cab1b079767540d80e56a39b423e4abf4";
      };
    }
    {
      name = "envinfo___envinfo_7.5.1.tgz";
      path = fetchurl {
        name = "envinfo___envinfo_7.5.1.tgz";
        url  = "https://registry.yarnpkg.com/envinfo/-/envinfo-7.5.1.tgz";
        sha1 = "93c26897225a00457c75e734d354ea9106a72236";
      };
    }
    {
      name = "errno___errno_0.1.7.tgz";
      path = fetchurl {
        name = "errno___errno_0.1.7.tgz";
        url  = "https://registry.yarnpkg.com/errno/-/errno-0.1.7.tgz";
        sha1 = "4684d71779ad39af177e3f007996f7c67c852618";
      };
    }
    {
      name = "error_ex___error_ex_1.3.2.tgz";
      path = fetchurl {
        name = "error_ex___error_ex_1.3.2.tgz";
        url  = "https://registry.yarnpkg.com/error-ex/-/error-ex-1.3.2.tgz";
        sha1 = "b4ac40648107fdcdcfae242f428bea8a14d4f1bf";
      };
    }
    {
      name = "error_stack_parser___error_stack_parser_2.0.6.tgz";
      path = fetchurl {
        name = "error_stack_parser___error_stack_parser_2.0.6.tgz";
        url  = "https://registry.yarnpkg.com/error-stack-parser/-/error-stack-parser-2.0.6.tgz";
        sha1 = "5a99a707bd7a4c58a797902d48d82803ede6aad8";
      };
    }
    {
      name = "es_abstract___es_abstract_1.17.5.tgz";
      path = fetchurl {
        name = "es_abstract___es_abstract_1.17.5.tgz";
        url  = "https://registry.yarnpkg.com/es-abstract/-/es-abstract-1.17.5.tgz";
        sha1 = "d8c9d1d66c8981fb9200e2251d799eee92774ae9";
      };
    }
    {
      name = "es_to_primitive___es_to_primitive_1.2.1.tgz";
      path = fetchurl {
        name = "es_to_primitive___es_to_primitive_1.2.1.tgz";
        url  = "https://registry.yarnpkg.com/es-to-primitive/-/es-to-primitive-1.2.1.tgz";
        sha1 = "e55cd4c9cdc188bcefb03b366c736323fc5c898a";
      };
    }
    {
      name = "escalade___escalade_3.1.1.tgz";
      path = fetchurl {
        name = "escalade___escalade_3.1.1.tgz";
        url  = "https://registry.yarnpkg.com/escalade/-/escalade-3.1.1.tgz";
        sha1 = "d8cfdc7000965c5a0174b4a82eaa5c0552742e40";
      };
    }
    {
      name = "escape_html___escape_html_1.0.3.tgz";
      path = fetchurl {
        name = "escape_html___escape_html_1.0.3.tgz";
        url  = "https://registry.yarnpkg.com/escape-html/-/escape-html-1.0.3.tgz";
        sha1 = "0258eae4d3d0c0974de1c169188ef0051d1d1988";
      };
    }
    {
      name = "escape_latex___escape_latex_1.2.0.tgz";
      path = fetchurl {
        name = "escape_latex___escape_latex_1.2.0.tgz";
        url  = "https://registry.yarnpkg.com/escape-latex/-/escape-latex-1.2.0.tgz";
        sha1 = "07c03818cf7dac250cce517f4fda1b001ef2bca1";
      };
    }
    {
      name = "escape_string_regexp___escape_string_regexp_1.0.5.tgz";
      path = fetchurl {
        name = "escape_string_regexp___escape_string_regexp_1.0.5.tgz";
        url  = "https://registry.yarnpkg.com/escape-string-regexp/-/escape-string-regexp-1.0.5.tgz";
        sha1 = "1b61c0562190a8dff6ae3bb2cf0200ca130b86d4";
      };
    }
    {
      name = "escodegen___escodegen_1.14.1.tgz";
      path = fetchurl {
        name = "escodegen___escodegen_1.14.1.tgz";
        url  = "https://registry.yarnpkg.com/escodegen/-/escodegen-1.14.1.tgz";
        sha1 = "ba01d0c8278b5e95a9a45350142026659027a457";
      };
    }
    {
      name = "escodegen___escodegen_1.9.1.tgz";
      path = fetchurl {
        name = "escodegen___escodegen_1.9.1.tgz";
        url  = "https://registry.yarnpkg.com/escodegen/-/escodegen-1.9.1.tgz";
        sha1 = "dbae17ef96c8e4bedb1356f4504fa4cc2f7cb7e2";
      };
    }
    {
      name = "esprima___esprima_3.1.3.tgz";
      path = fetchurl {
        name = "esprima___esprima_3.1.3.tgz";
        url  = "https://registry.yarnpkg.com/esprima/-/esprima-3.1.3.tgz";
        sha1 = "fdca51cee6133895e3c88d535ce49dbff62a4633";
      };
    }
    {
      name = "esprima___esprima_4.0.1.tgz";
      path = fetchurl {
        name = "esprima___esprima_4.0.1.tgz";
        url  = "https://registry.yarnpkg.com/esprima/-/esprima-4.0.1.tgz";
        sha1 = "13b04cdb3e6c5d19df91ab6987a8695619b0aa71";
      };
    }
    {
      name = "estraverse___estraverse_4.3.0.tgz";
      path = fetchurl {
        name = "estraverse___estraverse_4.3.0.tgz";
        url  = "https://registry.yarnpkg.com/estraverse/-/estraverse-4.3.0.tgz";
        sha1 = "398ad3f3c5a24948be7725e83d11a7de28cdbd1d";
      };
    }
    {
      name = "esutils___esutils_2.0.3.tgz";
      path = fetchurl {
        name = "esutils___esutils_2.0.3.tgz";
        url  = "https://registry.yarnpkg.com/esutils/-/esutils-2.0.3.tgz";
        sha1 = "74d2eb4de0b8da1293711910d50775b9b710ef64";
      };
    }
    {
      name = "etag___etag_1.8.1.tgz";
      path = fetchurl {
        name = "etag___etag_1.8.1.tgz";
        url  = "https://registry.yarnpkg.com/etag/-/etag-1.8.1.tgz";
        sha1 = "41ae2eeb65efa62268aebfea83ac7d79299b0887";
      };
    }
    {
      name = "eventemitter3___eventemitter3_3.1.2.tgz";
      path = fetchurl {
        name = "eventemitter3___eventemitter3_3.1.2.tgz";
        url  = "https://registry.yarnpkg.com/eventemitter3/-/eventemitter3-3.1.2.tgz";
        sha1 = "2d3d48f9c346698fce83a85d7d664e98535df6e7";
      };
    }
    {
      name = "eventlistener___eventlistener_0.0.1.tgz";
      path = fetchurl {
        name = "eventlistener___eventlistener_0.0.1.tgz";
        url  = "https://registry.yarnpkg.com/eventlistener/-/eventlistener-0.0.1.tgz";
        sha1 = "ed2baabb852227af2bcf889152c72c63ca532eb8";
      };
    }
    {
      name = "events___events_3.1.0.tgz";
      path = fetchurl {
        name = "events___events_3.1.0.tgz";
        url  = "https://registry.yarnpkg.com/events/-/events-3.1.0.tgz";
        sha1 = "84279af1b34cb75aa88bf5ff291f6d0bd9b31a59";
      };
    }
    {
      name = "evp_bytestokey___evp_bytestokey_1.0.3.tgz";
      path = fetchurl {
        name = "evp_bytestokey___evp_bytestokey_1.0.3.tgz";
        url  = "https://registry.yarnpkg.com/evp_bytestokey/-/evp_bytestokey-1.0.3.tgz";
        sha1 = "7fcbdb198dc71959432efe13842684e0525acb02";
      };
    }
    {
      name = "exec_sh___exec_sh_0.3.4.tgz";
      path = fetchurl {
        name = "exec_sh___exec_sh_0.3.4.tgz";
        url  = "https://registry.yarnpkg.com/exec-sh/-/exec-sh-0.3.4.tgz";
        sha1 = "3a018ceb526cc6f6df2bb504b2bfe8e3a4934ec5";
      };
    }
    {
      name = "execa___execa_1.0.0.tgz";
      path = fetchurl {
        name = "execa___execa_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/execa/-/execa-1.0.0.tgz";
        sha1 = "c6236a5bb4df6d6f15e88e7f017798216749ddd8";
      };
    }
    {
      name = "execa___execa_3.4.0.tgz";
      path = fetchurl {
        name = "execa___execa_3.4.0.tgz";
        url  = "https://registry.yarnpkg.com/execa/-/execa-3.4.0.tgz";
        sha1 = "c08ed4550ef65d858fac269ffc8572446f37eb89";
      };
    }
    {
      name = "exit___exit_0.1.2.tgz";
      path = fetchurl {
        name = "exit___exit_0.1.2.tgz";
        url  = "https://registry.yarnpkg.com/exit/-/exit-0.1.2.tgz";
        sha1 = "0632638f8d877cc82107d30a0fff1a17cba1cd0c";
      };
    }
    {
      name = "expand_brackets___expand_brackets_2.1.4.tgz";
      path = fetchurl {
        name = "expand_brackets___expand_brackets_2.1.4.tgz";
        url  = "https://registry.yarnpkg.com/expand-brackets/-/expand-brackets-2.1.4.tgz";
        sha1 = "b77735e315ce30f6b6eff0f83b04151a22449622";
      };
    }
    {
      name = "expect___expect_25.5.0.tgz";
      path = fetchurl {
        name = "expect___expect_25.5.0.tgz";
        url  = "https://registry.yarnpkg.com/expect/-/expect-25.5.0.tgz";
        sha1 = "f07f848712a2813bb59167da3fb828ca21f58bba";
      };
    }
    {
      name = "extend_shallow___extend_shallow_2.0.1.tgz";
      path = fetchurl {
        name = "extend_shallow___extend_shallow_2.0.1.tgz";
        url  = "https://registry.yarnpkg.com/extend-shallow/-/extend-shallow-2.0.1.tgz";
        sha1 = "51af7d614ad9a9f610ea1bafbb989d6b1c56890f";
      };
    }
    {
      name = "extend_shallow___extend_shallow_3.0.2.tgz";
      path = fetchurl {
        name = "extend_shallow___extend_shallow_3.0.2.tgz";
        url  = "https://registry.yarnpkg.com/extend-shallow/-/extend-shallow-3.0.2.tgz";
        sha1 = "26a71aaf073b39fb2127172746131c2704028db8";
      };
    }
    {
      name = "extend___extend_3.0.2.tgz";
      path = fetchurl {
        name = "extend___extend_3.0.2.tgz";
        url  = "https://registry.yarnpkg.com/extend/-/extend-3.0.2.tgz";
        sha1 = "f8b1136b4071fbd8eb140aff858b1019ec2915fa";
      };
    }
    {
      name = "extglob___extglob_2.0.4.tgz";
      path = fetchurl {
        name = "extglob___extglob_2.0.4.tgz";
        url  = "https://registry.yarnpkg.com/extglob/-/extglob-2.0.4.tgz";
        sha1 = "ad00fe4dc612a9232e8718711dc5cb5ab0285543";
      };
    }
    {
      name = "extract_files___extract_files_4.1.0.tgz";
      path = fetchurl {
        name = "extract_files___extract_files_4.1.0.tgz";
        url  = "https://registry.yarnpkg.com/extract-files/-/extract-files-4.1.0.tgz";
        sha1 = "2d5b64af688dfd030274ca542c43fabba325019a";
      };
    }
    {
      name = "extsprintf___extsprintf_1.3.0.tgz";
      path = fetchurl {
        name = "extsprintf___extsprintf_1.3.0.tgz";
        url  = "https://registry.yarnpkg.com/extsprintf/-/extsprintf-1.3.0.tgz";
        sha1 = "96918440e3041a7a414f8c52e3c574eb3c3e1e05";
      };
    }
    {
      name = "extsprintf___extsprintf_1.4.0.tgz";
      path = fetchurl {
        name = "extsprintf___extsprintf_1.4.0.tgz";
        url  = "https://registry.yarnpkg.com/extsprintf/-/extsprintf-1.4.0.tgz";
        sha1 = "e2689f8f356fad62cca65a3a91c5df5f9551692f";
      };
    }
    {
      name = "falafel___falafel_2.2.4.tgz";
      path = fetchurl {
        name = "falafel___falafel_2.2.4.tgz";
        url  = "https://registry.yarnpkg.com/falafel/-/falafel-2.2.4.tgz";
        sha1 = "b5d86c060c2412a43166243cb1bce44d1abd2819";
      };
    }
    {
      name = "fast_deep_equal___fast_deep_equal_3.1.1.tgz";
      path = fetchurl {
        name = "fast_deep_equal___fast_deep_equal_3.1.1.tgz";
        url  = "https://registry.yarnpkg.com/fast-deep-equal/-/fast-deep-equal-3.1.1.tgz";
        sha1 = "545145077c501491e33b15ec408c294376e94ae4";
      };
    }
    {
      name = "fast_deep_equal___fast_deep_equal_3.1.3.tgz";
      path = fetchurl {
        name = "fast_deep_equal___fast_deep_equal_3.1.3.tgz";
        url  = "https://registry.yarnpkg.com/fast-deep-equal/-/fast-deep-equal-3.1.3.tgz";
        sha1 = "3a7d56b559d6cbc3eb512325244e619a65c6c525";
      };
    }
    {
      name = "fast_glob___fast_glob_2.2.7.tgz";
      path = fetchurl {
        name = "fast_glob___fast_glob_2.2.7.tgz";
        url  = "https://registry.yarnpkg.com/fast-glob/-/fast-glob-2.2.7.tgz";
        sha1 = "6953857c3afa475fff92ee6015d52da70a4cd39d";
      };
    }
    {
      name = "fast_glob___fast_glob_3.2.2.tgz";
      path = fetchurl {
        name = "fast_glob___fast_glob_3.2.2.tgz";
        url  = "https://registry.yarnpkg.com/fast-glob/-/fast-glob-3.2.2.tgz";
        sha1 = "ade1a9d91148965d4bf7c51f72e1ca662d32e63d";
      };
    }
    {
      name = "fast_json_patch___fast_json_patch_3.0.0_1.tgz";
      path = fetchurl {
        name = "fast_json_patch___fast_json_patch_3.0.0_1.tgz";
        url  = "https://registry.yarnpkg.com/fast-json-patch/-/fast-json-patch-3.0.0-1.tgz";
        sha1 = "4c68f2e7acfbab6d29d1719c44be51899c93dabb";
      };
    }
    {
      name = "fast_json_stable_stringify___fast_json_stable_stringify_2.1.0.tgz";
      path = fetchurl {
        name = "fast_json_stable_stringify___fast_json_stable_stringify_2.1.0.tgz";
        url  = "https://registry.yarnpkg.com/fast-json-stable-stringify/-/fast-json-stable-stringify-2.1.0.tgz";
        sha1 = "874bf69c6f404c2b5d99c481341399fd55892633";
      };
    }
    {
      name = "fast_levenshtein___fast_levenshtein_2.0.6.tgz";
      path = fetchurl {
        name = "fast_levenshtein___fast_levenshtein_2.0.6.tgz";
        url  = "https://registry.yarnpkg.com/fast-levenshtein/-/fast-levenshtein-2.0.6.tgz";
        sha1 = "3d8a5c66883a16a30ca8643e851f19baa7797917";
      };
    }
    {
      name = "fast_shallow_equal___fast_shallow_equal_1.0.0.tgz";
      path = fetchurl {
        name = "fast_shallow_equal___fast_shallow_equal_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/fast-shallow-equal/-/fast-shallow-equal-1.0.0.tgz";
        sha1 = "d4dcaf6472440dcefa6f88b98e3251e27f25628b";
      };
    }
    {
      name = "fastest_stable_stringify___fastest_stable_stringify_1.0.1.tgz";
      path = fetchurl {
        name = "fastest_stable_stringify___fastest_stable_stringify_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/fastest-stable-stringify/-/fastest-stable-stringify-1.0.1.tgz";
        sha1 = "9122d406d4c9d98bea644a6b6853d5874b87b028";
      };
    }
    {
      name = "fastparse___fastparse_1.1.2.tgz";
      path = fetchurl {
        name = "fastparse___fastparse_1.1.2.tgz";
        url  = "https://registry.yarnpkg.com/fastparse/-/fastparse-1.1.2.tgz";
        sha1 = "91728c5a5942eced8531283c79441ee4122c35a9";
      };
    }
    {
      name = "fastq___fastq_1.7.0.tgz";
      path = fetchurl {
        name = "fastq___fastq_1.7.0.tgz";
        url  = "https://registry.yarnpkg.com/fastq/-/fastq-1.7.0.tgz";
        sha1 = "fcd79a08c5bd7ec5b55cd3f5c4720db551929801";
      };
    }
    {
      name = "fb_watchman___fb_watchman_2.0.1.tgz";
      path = fetchurl {
        name = "fb_watchman___fb_watchman_2.0.1.tgz";
        url  = "https://registry.yarnpkg.com/fb-watchman/-/fb-watchman-2.0.1.tgz";
        sha1 = "fc84fb39d2709cf3ff6d743706157bb5708a8a85";
      };
    }
    {
      name = "fbjs___fbjs_0.8.17.tgz";
      path = fetchurl {
        name = "fbjs___fbjs_0.8.17.tgz";
        url  = "https://registry.yarnpkg.com/fbjs/-/fbjs-0.8.17.tgz";
        sha1 = "c4d598ead6949112653d6588b01a5cdcd9f90fdd";
      };
    }
    {
      name = "file_uri_to_path___file_uri_to_path_1.0.0.tgz";
      path = fetchurl {
        name = "file_uri_to_path___file_uri_to_path_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/file-uri-to-path/-/file-uri-to-path-1.0.0.tgz";
        sha1 = "553a7b8446ff6f684359c445f1e37a05dacc33dd";
      };
    }
    {
      name = "filename_reserved_regex___filename_reserved_regex_1.0.0.tgz";
      path = fetchurl {
        name = "filename_reserved_regex___filename_reserved_regex_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/filename-reserved-regex/-/filename-reserved-regex-1.0.0.tgz";
        sha1 = "e61cf805f0de1c984567d0386dc5df50ee5af7e4";
      };
    }
    {
      name = "filenamify_url___filenamify_url_1.0.0.tgz";
      path = fetchurl {
        name = "filenamify_url___filenamify_url_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/filenamify-url/-/filenamify-url-1.0.0.tgz";
        sha1 = "b32bd81319ef5863b73078bed50f46a4f7975f50";
      };
    }
    {
      name = "filenamify___filenamify_1.2.1.tgz";
      path = fetchurl {
        name = "filenamify___filenamify_1.2.1.tgz";
        url  = "https://registry.yarnpkg.com/filenamify/-/filenamify-1.2.1.tgz";
        sha1 = "a9f2ffd11c503bed300015029272378f1f1365a5";
      };
    }
    {
      name = "filesize___filesize_3.6.1.tgz";
      path = fetchurl {
        name = "filesize___filesize_3.6.1.tgz";
        url  = "https://registry.yarnpkg.com/filesize/-/filesize-3.6.1.tgz";
        sha1 = "090bb3ee01b6f801a8a8be99d31710b3422bb317";
      };
    }
    {
      name = "fill_range___fill_range_4.0.0.tgz";
      path = fetchurl {
        name = "fill_range___fill_range_4.0.0.tgz";
        url  = "https://registry.yarnpkg.com/fill-range/-/fill-range-4.0.0.tgz";
        sha1 = "d544811d428f98eb06a63dc402d2403c328c38f7";
      };
    }
    {
      name = "fill_range___fill_range_7.0.1.tgz";
      path = fetchurl {
        name = "fill_range___fill_range_7.0.1.tgz";
        url  = "https://registry.yarnpkg.com/fill-range/-/fill-range-7.0.1.tgz";
        sha1 = "1919a6a7c75fe38b2c7c77e5198535da9acdda40";
      };
    }
    {
      name = "financejs___financejs_4.1.0.tgz";
      path = fetchurl {
        name = "financejs___financejs_4.1.0.tgz";
        url  = "https://registry.yarnpkg.com/financejs/-/financejs-4.1.0.tgz";
        sha1 = "e69b7cf4f0b5dd0c8a3b041992439513a2b93c41";
      };
    }
    {
      name = "find_root___find_root_1.1.0.tgz";
      path = fetchurl {
        name = "find_root___find_root_1.1.0.tgz";
        url  = "https://registry.yarnpkg.com/find-root/-/find-root-1.1.0.tgz";
        sha1 = "abcfc8ba76f708c42a97b3d685b7e9450bfb9ce4";
      };
    }
    {
      name = "find_up___find_up_2.1.0.tgz";
      path = fetchurl {
        name = "find_up___find_up_2.1.0.tgz";
        url  = "https://registry.yarnpkg.com/find-up/-/find-up-2.1.0.tgz";
        sha1 = "45d1b7e506c717ddd482775a2b77920a3c0c57a7";
      };
    }
    {
      name = "find_up___find_up_3.0.0.tgz";
      path = fetchurl {
        name = "find_up___find_up_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/find-up/-/find-up-3.0.0.tgz";
        sha1 = "49169f1d7993430646da61ecc5ae355c21c97b73";
      };
    }
    {
      name = "find_up___find_up_4.1.0.tgz";
      path = fetchurl {
        name = "find_up___find_up_4.1.0.tgz";
        url  = "https://registry.yarnpkg.com/find-up/-/find-up-4.1.0.tgz";
        sha1 = "97afe7d6cdc0bc5928584b7c8d7b16e8a9aa5d19";
      };
    }
    {
      name = "for_in___for_in_1.0.2.tgz";
      path = fetchurl {
        name = "for_in___for_in_1.0.2.tgz";
        url  = "https://registry.yarnpkg.com/for-in/-/for-in-1.0.2.tgz";
        sha1 = "81068d295a8142ec0ac726c6e2200c30fb6d5e80";
      };
    }
    {
      name = "foreach___foreach_2.0.5.tgz";
      path = fetchurl {
        name = "foreach___foreach_2.0.5.tgz";
        url  = "https://registry.yarnpkg.com/foreach/-/foreach-2.0.5.tgz";
        sha1 = "0bee005018aeb260d0a3af3ae658dd0136ec1b99";
      };
    }
    {
      name = "forever_agent___forever_agent_0.6.1.tgz";
      path = fetchurl {
        name = "forever_agent___forever_agent_0.6.1.tgz";
        url  = "https://registry.yarnpkg.com/forever-agent/-/forever-agent-0.6.1.tgz";
        sha1 = "fbc71f0c41adeb37f96c577ad1ed42d8fdacca91";
      };
    }
    {
      name = "form_data___form_data_2.3.3.tgz";
      path = fetchurl {
        name = "form_data___form_data_2.3.3.tgz";
        url  = "https://registry.yarnpkg.com/form-data/-/form-data-2.3.3.tgz";
        sha1 = "dcce52c05f644f298c6a7ab936bd724ceffbf3a6";
      };
    }
    {
      name = "fraction.js___fraction.js_4.0.12.tgz";
      path = fetchurl {
        name = "fraction.js___fraction.js_4.0.12.tgz";
        url  = "https://registry.yarnpkg.com/fraction.js/-/fraction.js-4.0.12.tgz";
        sha1 = "0526d47c65a5fb4854df78bc77f7bec708d7b8c3";
      };
    }
    {
      name = "fragment_cache___fragment_cache_0.2.1.tgz";
      path = fetchurl {
        name = "fragment_cache___fragment_cache_0.2.1.tgz";
        url  = "https://registry.yarnpkg.com/fragment-cache/-/fragment-cache-0.2.1.tgz";
        sha1 = "4290fad27f13e89be7f33799c6bc5a0abfff0d19";
      };
    }
    {
      name = "fresh___fresh_0.5.2.tgz";
      path = fetchurl {
        name = "fresh___fresh_0.5.2.tgz";
        url  = "https://registry.yarnpkg.com/fresh/-/fresh-0.5.2.tgz";
        sha1 = "3d8cadd90d976569fa835ab1f8e4b23a105605a7";
      };
    }
    {
      name = "fs_extra___fs_extra_8.1.0.tgz";
      path = fetchurl {
        name = "fs_extra___fs_extra_8.1.0.tgz";
        url  = "https://registry.yarnpkg.com/fs-extra/-/fs-extra-8.1.0.tgz";
        sha1 = "49d43c45a88cd9677668cb7be1b46efdb8d2e1c0";
      };
    }
    {
      name = "fs.realpath___fs.realpath_1.0.0.tgz";
      path = fetchurl {
        name = "fs.realpath___fs.realpath_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/fs.realpath/-/fs.realpath-1.0.0.tgz";
        sha1 = "1504ad2523158caa40db4a2787cb01411994ea4f";
      };
    }
    {
      name = "fsevents___fsevents_1.2.12.tgz";
      path = fetchurl {
        name = "fsevents___fsevents_1.2.12.tgz";
        url  = "https://registry.yarnpkg.com/fsevents/-/fsevents-1.2.12.tgz";
        sha1 = "db7e0d8ec3b0b45724fd4d83d43554a8f1f0de5c";
      };
    }
    {
      name = "fsevents___fsevents_2.1.3.tgz";
      path = fetchurl {
        name = "fsevents___fsevents_2.1.3.tgz";
        url  = "https://registry.yarnpkg.com/fsevents/-/fsevents-2.1.3.tgz";
        sha1 = "fb738703ae8d2f9fe900c33836ddebee8b97f23e";
      };
    }
    {
      name = "function_bind___function_bind_1.1.1.tgz";
      path = fetchurl {
        name = "function_bind___function_bind_1.1.1.tgz";
        url  = "https://registry.yarnpkg.com/function-bind/-/function-bind-1.1.1.tgz";
        sha1 = "a56899d3ea3c9bab874bb9773b7c5ede92f4895d";
      };
    }
    {
      name = "gensync___gensync_1.0.0_beta.1.tgz";
      path = fetchurl {
        name = "gensync___gensync_1.0.0_beta.1.tgz";
        url  = "https://registry.yarnpkg.com/gensync/-/gensync-1.0.0-beta.1.tgz";
        sha1 = "58f4361ff987e5ff6e1e7a210827aa371eaac269";
      };
    }
    {
      name = "get_caller_file___get_caller_file_1.0.3.tgz";
      path = fetchurl {
        name = "get_caller_file___get_caller_file_1.0.3.tgz";
        url  = "https://registry.yarnpkg.com/get-caller-file/-/get-caller-file-1.0.3.tgz";
        sha1 = "f978fa4c90d1dfe7ff2d6beda2a515e713bdcf4a";
      };
    }
    {
      name = "get_caller_file___get_caller_file_2.0.5.tgz";
      path = fetchurl {
        name = "get_caller_file___get_caller_file_2.0.5.tgz";
        url  = "https://registry.yarnpkg.com/get-caller-file/-/get-caller-file-2.0.5.tgz";
        sha1 = "4f94412a82db32f36e3b0b9741f8a97feb031f7e";
      };
    }
    {
      name = "get_port___get_port_3.2.0.tgz";
      path = fetchurl {
        name = "get_port___get_port_3.2.0.tgz";
        url  = "https://registry.yarnpkg.com/get-port/-/get-port-3.2.0.tgz";
        sha1 = "dd7ce7de187c06c8bf353796ac71e099f0980ebc";
      };
    }
    {
      name = "get_stdin___get_stdin_7.0.0.tgz";
      path = fetchurl {
        name = "get_stdin___get_stdin_7.0.0.tgz";
        url  = "https://registry.yarnpkg.com/get-stdin/-/get-stdin-7.0.0.tgz";
        sha1 = "8d5de98f15171a125c5e516643c7a6d0ea8a96f6";
      };
    }
    {
      name = "get_stream___get_stream_4.1.0.tgz";
      path = fetchurl {
        name = "get_stream___get_stream_4.1.0.tgz";
        url  = "https://registry.yarnpkg.com/get-stream/-/get-stream-4.1.0.tgz";
        sha1 = "c1b255575f3dc21d59bfc79cd3d2b46b1c3a54b5";
      };
    }
    {
      name = "get_stream___get_stream_5.1.0.tgz";
      path = fetchurl {
        name = "get_stream___get_stream_5.1.0.tgz";
        url  = "https://registry.yarnpkg.com/get-stream/-/get-stream-5.1.0.tgz";
        sha1 = "01203cdc92597f9b909067c3e656cc1f4d3c4dc9";
      };
    }
    {
      name = "get_value___get_value_2.0.6.tgz";
      path = fetchurl {
        name = "get_value___get_value_2.0.6.tgz";
        url  = "https://registry.yarnpkg.com/get-value/-/get-value-2.0.6.tgz";
        sha1 = "dc15ca1c672387ca76bd37ac0a395ba2042a2c28";
      };
    }
    {
      name = "getpass___getpass_0.1.7.tgz";
      path = fetchurl {
        name = "getpass___getpass_0.1.7.tgz";
        url  = "https://registry.yarnpkg.com/getpass/-/getpass-0.1.7.tgz";
        sha1 = "5eff8e3e684d569ae4cb2b1282604e8ba62149fa";
      };
    }
    {
      name = "gh_pages___gh_pages_2.2.0.tgz";
      path = fetchurl {
        name = "gh_pages___gh_pages_2.2.0.tgz";
        url  = "https://registry.yarnpkg.com/gh-pages/-/gh-pages-2.2.0.tgz";
        sha1 = "74ebeaca8d2b9a11279dcbd4a39ddfff3e6caa24";
      };
    }
    {
      name = "glob_parent___glob_parent_3.1.0.tgz";
      path = fetchurl {
        name = "glob_parent___glob_parent_3.1.0.tgz";
        url  = "https://registry.yarnpkg.com/glob-parent/-/glob-parent-3.1.0.tgz";
        sha1 = "9e6af6299d8d3bd2bd40430832bd113df906c5ae";
      };
    }
    {
      name = "glob_parent___glob_parent_5.1.1.tgz";
      path = fetchurl {
        name = "glob_parent___glob_parent_5.1.1.tgz";
        url  = "https://registry.yarnpkg.com/glob-parent/-/glob-parent-5.1.1.tgz";
        sha1 = "b6c1ef417c4e5663ea498f1c45afac6916bbc229";
      };
    }
    {
      name = "glob_to_regexp___glob_to_regexp_0.3.0.tgz";
      path = fetchurl {
        name = "glob_to_regexp___glob_to_regexp_0.3.0.tgz";
        url  = "https://registry.yarnpkg.com/glob-to-regexp/-/glob-to-regexp-0.3.0.tgz";
        sha1 = "8c5a1494d2066c570cc3bfe4496175acc4d502ab";
      };
    }
    {
      name = "glob___glob_7.1.6.tgz";
      path = fetchurl {
        name = "glob___glob_7.1.6.tgz";
        url  = "https://registry.yarnpkg.com/glob/-/glob-7.1.6.tgz";
        sha1 = "141f33b81a7c2492e125594307480c46679278a6";
      };
    }
    {
      name = "globals___globals_11.12.0.tgz";
      path = fetchurl {
        name = "globals___globals_11.12.0.tgz";
        url  = "https://registry.yarnpkg.com/globals/-/globals-11.12.0.tgz";
        sha1 = "ab8795338868a0babd8525758018c2a7eb95c42e";
      };
    }
    {
      name = "globals___globals_9.18.0.tgz";
      path = fetchurl {
        name = "globals___globals_9.18.0.tgz";
        url  = "https://registry.yarnpkg.com/globals/-/globals-9.18.0.tgz";
        sha1 = "aa3896b3e69b487f17e31ed2143d69a8e30c2d8a";
      };
    }
    {
      name = "globby___globby_10.0.2.tgz";
      path = fetchurl {
        name = "globby___globby_10.0.2.tgz";
        url  = "https://registry.yarnpkg.com/globby/-/globby-10.0.2.tgz";
        sha1 = "277593e745acaa4646c3ab411289ec47a0392543";
      };
    }
    {
      name = "globby___globby_6.1.0.tgz";
      path = fetchurl {
        name = "globby___globby_6.1.0.tgz";
        url  = "https://registry.yarnpkg.com/globby/-/globby-6.1.0.tgz";
        sha1 = "f5a6d70e8395e21c858fb0489d64df02424d506c";
      };
    }
    {
      name = "graceful_fs___graceful_fs_4.2.4.tgz";
      path = fetchurl {
        name = "graceful_fs___graceful_fs_4.2.4.tgz";
        url  = "https://registry.yarnpkg.com/graceful-fs/-/graceful-fs-4.2.4.tgz";
        sha1 = "2256bde14d3632958c465ebc96dc467ca07a29fb";
      };
    }
    {
      name = "grapheme_breaker___grapheme_breaker_0.3.2.tgz";
      path = fetchurl {
        name = "grapheme_breaker___grapheme_breaker_0.3.2.tgz";
        url  = "https://registry.yarnpkg.com/grapheme-breaker/-/grapheme-breaker-0.3.2.tgz";
        sha1 = "5b9e6b78c3832452d2ba2bb1cb830f96276410ac";
      };
    }
    {
      name = "graphql_tag___graphql_tag_2.10.3.tgz";
      path = fetchurl {
        name = "graphql_tag___graphql_tag_2.10.3.tgz";
        url  = "https://registry.yarnpkg.com/graphql-tag/-/graphql-tag-2.10.3.tgz";
        sha1 = "ea1baba5eb8fc6339e4c4cf049dabe522b0edf03";
      };
    }
    {
      name = "graphql___graphql_14.6.0.tgz";
      path = fetchurl {
        name = "graphql___graphql_14.6.0.tgz";
        url  = "https://registry.yarnpkg.com/graphql/-/graphql-14.6.0.tgz";
        sha1 = "57822297111e874ea12f5cd4419616930cd83e49";
      };
    }
    {
      name = "growly___growly_1.3.0.tgz";
      path = fetchurl {
        name = "growly___growly_1.3.0.tgz";
        url  = "https://registry.yarnpkg.com/growly/-/growly-1.3.0.tgz";
        sha1 = "f10748cbe76af964b7c96c93c6bcc28af120c081";
      };
    }
    {
      name = "gud___gud_1.0.0.tgz";
      path = fetchurl {
        name = "gud___gud_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/gud/-/gud-1.0.0.tgz";
        sha1 = "a489581b17e6a70beca9abe3ae57de7a499852c0";
      };
    }
    {
      name = "gzip_size___gzip_size_4.1.0.tgz";
      path = fetchurl {
        name = "gzip_size___gzip_size_4.1.0.tgz";
        url  = "https://registry.yarnpkg.com/gzip-size/-/gzip-size-4.1.0.tgz";
        sha1 = "8ae096257eabe7d69c45be2b67c448124ffb517c";
      };
    }
    {
      name = "hammerjs___hammerjs_2.0.8.tgz";
      path = fetchurl {
        name = "hammerjs___hammerjs_2.0.8.tgz";
        url  = "https://registry.yarnpkg.com/hammerjs/-/hammerjs-2.0.8.tgz";
        sha1 = "04ef77862cff2bb79d30f7692095930222bf60f1";
      };
    }
    {
      name = "har_schema___har_schema_2.0.0.tgz";
      path = fetchurl {
        name = "har_schema___har_schema_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/har-schema/-/har-schema-2.0.0.tgz";
        sha1 = "a94c2224ebcac04782a0d9035521f24735b7ec92";
      };
    }
    {
      name = "har_validator___har_validator_5.1.3.tgz";
      path = fetchurl {
        name = "har_validator___har_validator_5.1.3.tgz";
        url  = "https://registry.yarnpkg.com/har-validator/-/har-validator-5.1.3.tgz";
        sha1 = "1ef89ebd3e4996557675eed9893110dc350fa080";
      };
    }
    {
      name = "has_ansi___has_ansi_2.0.0.tgz";
      path = fetchurl {
        name = "has_ansi___has_ansi_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/has-ansi/-/has-ansi-2.0.0.tgz";
        sha1 = "34f5049ce1ecdf2b0649af3ef24e45ed35416d91";
      };
    }
    {
      name = "has_flag___has_flag_1.0.0.tgz";
      path = fetchurl {
        name = "has_flag___has_flag_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/has-flag/-/has-flag-1.0.0.tgz";
        sha1 = "9d9e793165ce017a00f00418c43f942a7b1d11fa";
      };
    }
    {
      name = "has_flag___has_flag_3.0.0.tgz";
      path = fetchurl {
        name = "has_flag___has_flag_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/has-flag/-/has-flag-3.0.0.tgz";
        sha1 = "b5d454dc2199ae225699f3467e5a07f3b955bafd";
      };
    }
    {
      name = "has_flag___has_flag_4.0.0.tgz";
      path = fetchurl {
        name = "has_flag___has_flag_4.0.0.tgz";
        url  = "https://registry.yarnpkg.com/has-flag/-/has-flag-4.0.0.tgz";
        sha1 = "944771fd9c81c81265c4d6941860da06bb59479b";
      };
    }
    {
      name = "has_symbols___has_symbols_1.0.1.tgz";
      path = fetchurl {
        name = "has_symbols___has_symbols_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/has-symbols/-/has-symbols-1.0.1.tgz";
        sha1 = "9f5214758a44196c406d9bd76cebf81ec2dd31e8";
      };
    }
    {
      name = "has_value___has_value_0.3.1.tgz";
      path = fetchurl {
        name = "has_value___has_value_0.3.1.tgz";
        url  = "https://registry.yarnpkg.com/has-value/-/has-value-0.3.1.tgz";
        sha1 = "7b1f58bada62ca827ec0a2078025654845995e1f";
      };
    }
    {
      name = "has_value___has_value_1.0.0.tgz";
      path = fetchurl {
        name = "has_value___has_value_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/has-value/-/has-value-1.0.0.tgz";
        sha1 = "18b281da585b1c5c51def24c930ed29a0be6b177";
      };
    }
    {
      name = "has_values___has_values_0.1.4.tgz";
      path = fetchurl {
        name = "has_values___has_values_0.1.4.tgz";
        url  = "https://registry.yarnpkg.com/has-values/-/has-values-0.1.4.tgz";
        sha1 = "6d61de95d91dfca9b9a02089ad384bff8f62b771";
      };
    }
    {
      name = "has_values___has_values_1.0.0.tgz";
      path = fetchurl {
        name = "has_values___has_values_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/has-values/-/has-values-1.0.0.tgz";
        sha1 = "95b0b63fec2146619a6fe57fe75628d5a39efe4f";
      };
    }
    {
      name = "has___has_1.0.3.tgz";
      path = fetchurl {
        name = "has___has_1.0.3.tgz";
        url  = "https://registry.yarnpkg.com/has/-/has-1.0.3.tgz";
        sha1 = "722d7cbfc1f6aa8241f16dd814e011e1f41e8796";
      };
    }
    {
      name = "hash_base___hash_base_3.0.4.tgz";
      path = fetchurl {
        name = "hash_base___hash_base_3.0.4.tgz";
        url  = "https://registry.yarnpkg.com/hash-base/-/hash-base-3.0.4.tgz";
        sha1 = "5fc8686847ecd73499403319a6b0a3f3f6ae4918";
      };
    }
    {
      name = "hash.js___hash.js_1.1.7.tgz";
      path = fetchurl {
        name = "hash.js___hash.js_1.1.7.tgz";
        url  = "https://registry.yarnpkg.com/hash.js/-/hash.js-1.1.7.tgz";
        sha1 = "0babca538e8d4ee4a0f8988d68866537a003cf42";
      };
    }
    {
      name = "hex_color_regex___hex_color_regex_1.1.0.tgz";
      path = fetchurl {
        name = "hex_color_regex___hex_color_regex_1.1.0.tgz";
        url  = "https://registry.yarnpkg.com/hex-color-regex/-/hex-color-regex-1.1.0.tgz";
        sha1 = "4c06fccb4602fe2602b3c93df82d7e7dbf1a8a8e";
      };
    }
    {
      name = "hmac_drbg___hmac_drbg_1.0.1.tgz";
      path = fetchurl {
        name = "hmac_drbg___hmac_drbg_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/hmac-drbg/-/hmac-drbg-1.0.1.tgz";
        sha1 = "d2745701025a6c775a6c545793ed502fc0c649a1";
      };
    }
    {
      name = "hoist_non_react_statics___hoist_non_react_statics_2.5.5.tgz";
      path = fetchurl {
        name = "hoist_non_react_statics___hoist_non_react_statics_2.5.5.tgz";
        url  = "https://registry.yarnpkg.com/hoist-non-react-statics/-/hoist-non-react-statics-2.5.5.tgz";
        sha1 = "c5903cf409c0dfd908f388e619d86b9c1174cb47";
      };
    }
    {
      name = "hoist_non_react_statics___hoist_non_react_statics_3.3.2.tgz";
      path = fetchurl {
        name = "hoist_non_react_statics___hoist_non_react_statics_3.3.2.tgz";
        url  = "https://registry.yarnpkg.com/hoist-non-react-statics/-/hoist-non-react-statics-3.3.2.tgz";
        sha1 = "ece0acaf71d62c2969c2ec59feff42a4b1a85b45";
      };
    }
    {
      name = "hosted_git_info___hosted_git_info_2.8.8.tgz";
      path = fetchurl {
        name = "hosted_git_info___hosted_git_info_2.8.8.tgz";
        url  = "https://registry.yarnpkg.com/hosted-git-info/-/hosted-git-info-2.8.8.tgz";
        sha1 = "7539bd4bc1e0e0a895815a2e0262420b12858488";
      };
    }
    {
      name = "hsl_regex___hsl_regex_1.0.0.tgz";
      path = fetchurl {
        name = "hsl_regex___hsl_regex_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/hsl-regex/-/hsl-regex-1.0.0.tgz";
        sha1 = "d49330c789ed819e276a4c0d272dffa30b18fe6e";
      };
    }
    {
      name = "hsla_regex___hsla_regex_1.0.0.tgz";
      path = fetchurl {
        name = "hsla_regex___hsla_regex_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/hsla-regex/-/hsla-regex-1.0.0.tgz";
        sha1 = "c1ce7a3168c8c6614033a4b5f7877f3b225f9c38";
      };
    }
    {
      name = "html_comment_regex___html_comment_regex_1.1.2.tgz";
      path = fetchurl {
        name = "html_comment_regex___html_comment_regex_1.1.2.tgz";
        url  = "https://registry.yarnpkg.com/html-comment-regex/-/html-comment-regex-1.1.2.tgz";
        sha1 = "97d4688aeb5c81886a364faa0cad1dda14d433a7";
      };
    }
    {
      name = "html_encoding_sniffer___html_encoding_sniffer_1.0.2.tgz";
      path = fetchurl {
        name = "html_encoding_sniffer___html_encoding_sniffer_1.0.2.tgz";
        url  = "https://registry.yarnpkg.com/html-encoding-sniffer/-/html-encoding-sniffer-1.0.2.tgz";
        sha1 = "e70d84b94da53aa375e11fe3a351be6642ca46f8";
      };
    }
    {
      name = "html_escaper___html_escaper_2.0.2.tgz";
      path = fetchurl {
        name = "html_escaper___html_escaper_2.0.2.tgz";
        url  = "https://registry.yarnpkg.com/html-escaper/-/html-escaper-2.0.2.tgz";
        sha1 = "dfd60027da36a36dfcbe236262c00a5822681453";
      };
    }
    {
      name = "html_tags___html_tags_1.2.0.tgz";
      path = fetchurl {
        name = "html_tags___html_tags_1.2.0.tgz";
        url  = "https://registry.yarnpkg.com/html-tags/-/html-tags-1.2.0.tgz";
        sha1 = "c78de65b5663aa597989dd2b7ab49200d7e4db98";
      };
    }
    {
      name = "htmlnano___htmlnano_0.2.5.tgz";
      path = fetchurl {
        name = "htmlnano___htmlnano_0.2.5.tgz";
        url  = "https://registry.yarnpkg.com/htmlnano/-/htmlnano-0.2.5.tgz";
        sha1 = "134fd9548c7cbe51c8508ce434a3f9488cff1b0b";
      };
    }
    {
      name = "htmlparser2___htmlparser2_3.10.1.tgz";
      path = fetchurl {
        name = "htmlparser2___htmlparser2_3.10.1.tgz";
        url  = "https://registry.yarnpkg.com/htmlparser2/-/htmlparser2-3.10.1.tgz";
        sha1 = "bd679dc3f59897b6a34bb10749c855bb53a9392f";
      };
    }
    {
      name = "http_errors___http_errors_1.7.3.tgz";
      path = fetchurl {
        name = "http_errors___http_errors_1.7.3.tgz";
        url  = "https://registry.yarnpkg.com/http-errors/-/http-errors-1.7.3.tgz";
        sha1 = "6c619e4f9c60308c38519498c14fbb10aacebb06";
      };
    }
    {
      name = "http_signature___http_signature_1.2.0.tgz";
      path = fetchurl {
        name = "http_signature___http_signature_1.2.0.tgz";
        url  = "https://registry.yarnpkg.com/http-signature/-/http-signature-1.2.0.tgz";
        sha1 = "9aecd925114772f3d95b65a60abb8f7c18fbace1";
      };
    }
    {
      name = "https_browserify___https_browserify_1.0.0.tgz";
      path = fetchurl {
        name = "https_browserify___https_browserify_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/https-browserify/-/https-browserify-1.0.0.tgz";
        sha1 = "ec06c10e0a34c0f2faf199f7fd7fc78fffd03c73";
      };
    }
    {
      name = "human_signals___human_signals_1.1.1.tgz";
      path = fetchurl {
        name = "human_signals___human_signals_1.1.1.tgz";
        url  = "https://registry.yarnpkg.com/human-signals/-/human-signals-1.1.1.tgz";
        sha1 = "c5b1cd14f50aeae09ab6c59fe63ba3395fe4dfa3";
      };
    }
    {
      name = "humanize_url___humanize_url_1.0.1.tgz";
      path = fetchurl {
        name = "humanize_url___humanize_url_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/humanize-url/-/humanize-url-1.0.1.tgz";
        sha1 = "f4ab99e0d288174ca4e1e50407c55fbae464efff";
      };
    }
    {
      name = "hyphenate_style_name___hyphenate_style_name_1.0.3.tgz";
      path = fetchurl {
        name = "hyphenate_style_name___hyphenate_style_name_1.0.3.tgz";
        url  = "https://registry.yarnpkg.com/hyphenate-style-name/-/hyphenate-style-name-1.0.3.tgz";
        sha1 = "097bb7fa0b8f1a9cf0bd5c734cf95899981a9b48";
      };
    }
    {
      name = "iconv_lite___iconv_lite_0.4.24.tgz";
      path = fetchurl {
        name = "iconv_lite___iconv_lite_0.4.24.tgz";
        url  = "https://registry.yarnpkg.com/iconv-lite/-/iconv-lite-0.4.24.tgz";
        sha1 = "2022b4b25fbddc21d2f524974a474aafe733908b";
      };
    }
    {
      name = "icss_replace_symbols___icss_replace_symbols_1.1.0.tgz";
      path = fetchurl {
        name = "icss_replace_symbols___icss_replace_symbols_1.1.0.tgz";
        url  = "https://registry.yarnpkg.com/icss-replace-symbols/-/icss-replace-symbols-1.1.0.tgz";
        sha1 = "06ea6f83679a7749e386cfe1fe812ae5db223ded";
      };
    }
    {
      name = "ieee754___ieee754_1.1.13.tgz";
      path = fetchurl {
        name = "ieee754___ieee754_1.1.13.tgz";
        url  = "https://registry.yarnpkg.com/ieee754/-/ieee754-1.1.13.tgz";
        sha1 = "ec168558e95aa181fd87d37f55c32bbcb6708b84";
      };
    }
    {
      name = "ignore___ignore_5.1.4.tgz";
      path = fetchurl {
        name = "ignore___ignore_5.1.4.tgz";
        url  = "https://registry.yarnpkg.com/ignore/-/ignore-5.1.4.tgz";
        sha1 = "84b7b3dbe64552b6ef0eca99f6743dbec6d97adf";
      };
    }
    {
      name = "image_size___image_size_0.5.5.tgz";
      path = fetchurl {
        name = "image_size___image_size_0.5.5.tgz";
        url  = "https://registry.yarnpkg.com/image-size/-/image-size-0.5.5.tgz";
        sha1 = "09dfd4ab9d20e29eb1c3e80b8990378df9e3cb9c";
      };
    }
    {
      name = "immutable___immutable_3.8.2.tgz";
      path = fetchurl {
        name = "immutable___immutable_3.8.2.tgz";
        url  = "https://registry.yarnpkg.com/immutable/-/immutable-3.8.2.tgz";
        sha1 = "c2439951455bb39913daf281376f1530e104adf3";
      };
    }
    {
      name = "immutable___immutable_3.7.6.tgz";
      path = fetchurl {
        name = "immutable___immutable_3.7.6.tgz";
        url  = "https://registry.yarnpkg.com/immutable/-/immutable-3.7.6.tgz";
        sha1 = "13b4d3cb12befa15482a26fe1b2ebae640071e4b";
      };
    }
    {
      name = "import_cwd___import_cwd_2.1.0.tgz";
      path = fetchurl {
        name = "import_cwd___import_cwd_2.1.0.tgz";
        url  = "https://registry.yarnpkg.com/import-cwd/-/import-cwd-2.1.0.tgz";
        sha1 = "aa6cf36e722761285cb371ec6519f53e2435b0a9";
      };
    }
    {
      name = "import_fresh___import_fresh_2.0.0.tgz";
      path = fetchurl {
        name = "import_fresh___import_fresh_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/import-fresh/-/import-fresh-2.0.0.tgz";
        sha1 = "d81355c15612d386c61f9ddd3922d4304822a546";
      };
    }
    {
      name = "import_fresh___import_fresh_3.2.1.tgz";
      path = fetchurl {
        name = "import_fresh___import_fresh_3.2.1.tgz";
        url  = "https://registry.yarnpkg.com/import-fresh/-/import-fresh-3.2.1.tgz";
        sha1 = "633ff618506e793af5ac91bf48b72677e15cbe66";
      };
    }
    {
      name = "import_from___import_from_2.1.0.tgz";
      path = fetchurl {
        name = "import_from___import_from_2.1.0.tgz";
        url  = "https://registry.yarnpkg.com/import-from/-/import-from-2.1.0.tgz";
        sha1 = "335db7f2a7affd53aaa471d4b8021dee36b7f3b1";
      };
    }
    {
      name = "import_local___import_local_3.0.2.tgz";
      path = fetchurl {
        name = "import_local___import_local_3.0.2.tgz";
        url  = "https://registry.yarnpkg.com/import-local/-/import-local-3.0.2.tgz";
        sha1 = "a8cfd0431d1de4a2199703d003e3e62364fa6db6";
      };
    }
    {
      name = "imurmurhash___imurmurhash_0.1.4.tgz";
      path = fetchurl {
        name = "imurmurhash___imurmurhash_0.1.4.tgz";
        url  = "https://registry.yarnpkg.com/imurmurhash/-/imurmurhash-0.1.4.tgz";
        sha1 = "9218b9b2b928a238b13dc4fb6b6d576f231453ea";
      };
    }
    {
      name = "indexes_of___indexes_of_1.0.1.tgz";
      path = fetchurl {
        name = "indexes_of___indexes_of_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/indexes-of/-/indexes-of-1.0.1.tgz";
        sha1 = "f30f716c8e2bd346c7b67d3df3915566a7c05607";
      };
    }
    {
      name = "inflight___inflight_1.0.6.tgz";
      path = fetchurl {
        name = "inflight___inflight_1.0.6.tgz";
        url  = "https://registry.yarnpkg.com/inflight/-/inflight-1.0.6.tgz";
        sha1 = "49bd6331d7d02d0c09bc910a1075ba8165b56df9";
      };
    }
    {
      name = "inherits___inherits_2.0.4.tgz";
      path = fetchurl {
        name = "inherits___inherits_2.0.4.tgz";
        url  = "https://registry.yarnpkg.com/inherits/-/inherits-2.0.4.tgz";
        sha1 = "0fa2c64f932917c3433a0ded55363aae37416b7c";
      };
    }
    {
      name = "inherits___inherits_2.0.1.tgz";
      path = fetchurl {
        name = "inherits___inherits_2.0.1.tgz";
        url  = "https://registry.yarnpkg.com/inherits/-/inherits-2.0.1.tgz";
        sha1 = "b17d08d326b4423e568eff719f91b0b1cbdf69f1";
      };
    }
    {
      name = "inherits___inherits_2.0.3.tgz";
      path = fetchurl {
        name = "inherits___inherits_2.0.3.tgz";
        url  = "https://registry.yarnpkg.com/inherits/-/inherits-2.0.3.tgz";
        sha1 = "633c2c83e3da42a502f52466022480f4208261de";
      };
    }
    {
      name = "ini___ini_1.3.5.tgz";
      path = fetchurl {
        name = "ini___ini_1.3.5.tgz";
        url  = "https://registry.yarnpkg.com/ini/-/ini-1.3.5.tgz";
        sha1 = "eee25f56db1c9ec6085e0c22778083f596abf927";
      };
    }
    {
      name = "inline_style_prefixer___inline_style_prefixer_4.0.2.tgz";
      path = fetchurl {
        name = "inline_style_prefixer___inline_style_prefixer_4.0.2.tgz";
        url  = "https://registry.yarnpkg.com/inline-style-prefixer/-/inline-style-prefixer-4.0.2.tgz";
        sha1 = "d390957d26f281255fe101da863158ac6eb60911";
      };
    }
    {
      name = "invariant___invariant_2.2.4.tgz";
      path = fetchurl {
        name = "invariant___invariant_2.2.4.tgz";
        url  = "https://registry.yarnpkg.com/invariant/-/invariant-2.2.4.tgz";
        sha1 = "610f3c92c9359ce1db616e538008d23ff35158e6";
      };
    }
    {
      name = "invert_kv___invert_kv_2.0.0.tgz";
      path = fetchurl {
        name = "invert_kv___invert_kv_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/invert-kv/-/invert-kv-2.0.0.tgz";
        sha1 = "7393f5afa59ec9ff5f67a27620d11c226e3eec02";
      };
    }
    {
      name = "ip_regex___ip_regex_2.1.0.tgz";
      path = fetchurl {
        name = "ip_regex___ip_regex_2.1.0.tgz";
        url  = "https://registry.yarnpkg.com/ip-regex/-/ip-regex-2.1.0.tgz";
        sha1 = "fa78bf5d2e6913c911ce9f819ee5146bb6d844e9";
      };
    }
    {
      name = "is_absolute_url___is_absolute_url_2.1.0.tgz";
      path = fetchurl {
        name = "is_absolute_url___is_absolute_url_2.1.0.tgz";
        url  = "https://registry.yarnpkg.com/is-absolute-url/-/is-absolute-url-2.1.0.tgz";
        sha1 = "50530dfb84fcc9aa7dbe7852e83a37b93b9f2aa6";
      };
    }
    {
      name = "is_absolute_url___is_absolute_url_3.0.3.tgz";
      path = fetchurl {
        name = "is_absolute_url___is_absolute_url_3.0.3.tgz";
        url  = "https://registry.yarnpkg.com/is-absolute-url/-/is-absolute-url-3.0.3.tgz";
        sha1 = "96c6a22b6a23929b11ea0afb1836c36ad4a5d698";
      };
    }
    {
      name = "is_accessor_descriptor___is_accessor_descriptor_0.1.6.tgz";
      path = fetchurl {
        name = "is_accessor_descriptor___is_accessor_descriptor_0.1.6.tgz";
        url  = "https://registry.yarnpkg.com/is-accessor-descriptor/-/is-accessor-descriptor-0.1.6.tgz";
        sha1 = "a9e12cb3ae8d876727eeef3843f8a0897b5c98d6";
      };
    }
    {
      name = "is_accessor_descriptor___is_accessor_descriptor_1.0.0.tgz";
      path = fetchurl {
        name = "is_accessor_descriptor___is_accessor_descriptor_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/is-accessor-descriptor/-/is-accessor-descriptor-1.0.0.tgz";
        sha1 = "169c2f6d3df1f992618072365c9b0ea1f6878656";
      };
    }
    {
      name = "is_arrayish___is_arrayish_0.2.1.tgz";
      path = fetchurl {
        name = "is_arrayish___is_arrayish_0.2.1.tgz";
        url  = "https://registry.yarnpkg.com/is-arrayish/-/is-arrayish-0.2.1.tgz";
        sha1 = "77c99840527aa8ecb1a8ba697b80645a7a926a9d";
      };
    }
    {
      name = "is_arrayish___is_arrayish_0.3.2.tgz";
      path = fetchurl {
        name = "is_arrayish___is_arrayish_0.3.2.tgz";
        url  = "https://registry.yarnpkg.com/is-arrayish/-/is-arrayish-0.3.2.tgz";
        sha1 = "4574a2ae56f7ab206896fb431eaeed066fdf8f03";
      };
    }
    {
      name = "is_binary_path___is_binary_path_1.0.1.tgz";
      path = fetchurl {
        name = "is_binary_path___is_binary_path_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/is-binary-path/-/is-binary-path-1.0.1.tgz";
        sha1 = "75f16642b480f187a711c814161fd3a4a7655898";
      };
    }
    {
      name = "is_binary_path___is_binary_path_2.1.0.tgz";
      path = fetchurl {
        name = "is_binary_path___is_binary_path_2.1.0.tgz";
        url  = "https://registry.yarnpkg.com/is-binary-path/-/is-binary-path-2.1.0.tgz";
        sha1 = "ea1f7f3b80f064236e83470f86c09c254fb45b09";
      };
    }
    {
      name = "is_buffer___is_buffer_1.1.6.tgz";
      path = fetchurl {
        name = "is_buffer___is_buffer_1.1.6.tgz";
        url  = "https://registry.yarnpkg.com/is-buffer/-/is-buffer-1.1.6.tgz";
        sha1 = "efaa2ea9daa0d7ab2ea13a97b2b8ad51fefbe8be";
      };
    }
    {
      name = "is_callable___is_callable_1.1.5.tgz";
      path = fetchurl {
        name = "is_callable___is_callable_1.1.5.tgz";
        url  = "https://registry.yarnpkg.com/is-callable/-/is-callable-1.1.5.tgz";
        sha1 = "f7e46b596890456db74e7f6e976cb3273d06faab";
      };
    }
    {
      name = "is_ci___is_ci_2.0.0.tgz";
      path = fetchurl {
        name = "is_ci___is_ci_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/is-ci/-/is-ci-2.0.0.tgz";
        sha1 = "6bc6334181810e04b5c22b3d589fdca55026404c";
      };
    }
    {
      name = "is_color_stop___is_color_stop_1.1.0.tgz";
      path = fetchurl {
        name = "is_color_stop___is_color_stop_1.1.0.tgz";
        url  = "https://registry.yarnpkg.com/is-color-stop/-/is-color-stop-1.1.0.tgz";
        sha1 = "cfff471aee4dd5c9e158598fbe12967b5cdad345";
      };
    }
    {
      name = "is_data_descriptor___is_data_descriptor_0.1.4.tgz";
      path = fetchurl {
        name = "is_data_descriptor___is_data_descriptor_0.1.4.tgz";
        url  = "https://registry.yarnpkg.com/is-data-descriptor/-/is-data-descriptor-0.1.4.tgz";
        sha1 = "0b5ee648388e2c860282e793f1856fec3f301b56";
      };
    }
    {
      name = "is_data_descriptor___is_data_descriptor_1.0.0.tgz";
      path = fetchurl {
        name = "is_data_descriptor___is_data_descriptor_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/is-data-descriptor/-/is-data-descriptor-1.0.0.tgz";
        sha1 = "d84876321d0e7add03990406abbbbd36ba9268c7";
      };
    }
    {
      name = "is_date_object___is_date_object_1.0.2.tgz";
      path = fetchurl {
        name = "is_date_object___is_date_object_1.0.2.tgz";
        url  = "https://registry.yarnpkg.com/is-date-object/-/is-date-object-1.0.2.tgz";
        sha1 = "bda736f2cd8fd06d32844e7743bfa7494c3bfd7e";
      };
    }
    {
      name = "is_descriptor___is_descriptor_0.1.6.tgz";
      path = fetchurl {
        name = "is_descriptor___is_descriptor_0.1.6.tgz";
        url  = "https://registry.yarnpkg.com/is-descriptor/-/is-descriptor-0.1.6.tgz";
        sha1 = "366d8240dde487ca51823b1ab9f07a10a78251ca";
      };
    }
    {
      name = "is_descriptor___is_descriptor_1.0.2.tgz";
      path = fetchurl {
        name = "is_descriptor___is_descriptor_1.0.2.tgz";
        url  = "https://registry.yarnpkg.com/is-descriptor/-/is-descriptor-1.0.2.tgz";
        sha1 = "3b159746a66604b04f8c81524ba365c5f14d86ec";
      };
    }
    {
      name = "is_directory___is_directory_0.3.1.tgz";
      path = fetchurl {
        name = "is_directory___is_directory_0.3.1.tgz";
        url  = "https://registry.yarnpkg.com/is-directory/-/is-directory-0.3.1.tgz";
        sha1 = "61339b6f2475fc772fd9c9d83f5c8575dc154ae1";
      };
    }
    {
      name = "is_extendable___is_extendable_0.1.1.tgz";
      path = fetchurl {
        name = "is_extendable___is_extendable_0.1.1.tgz";
        url  = "https://registry.yarnpkg.com/is-extendable/-/is-extendable-0.1.1.tgz";
        sha1 = "62b110e289a471418e3ec36a617d472e301dfc89";
      };
    }
    {
      name = "is_extendable___is_extendable_1.0.1.tgz";
      path = fetchurl {
        name = "is_extendable___is_extendable_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/is-extendable/-/is-extendable-1.0.1.tgz";
        sha1 = "a7470f9e426733d81bd81e1155264e3a3507cab4";
      };
    }
    {
      name = "is_extglob___is_extglob_2.1.1.tgz";
      path = fetchurl {
        name = "is_extglob___is_extglob_2.1.1.tgz";
        url  = "https://registry.yarnpkg.com/is-extglob/-/is-extglob-2.1.1.tgz";
        sha1 = "a88c02535791f02ed37c76a1b9ea9773c833f8c2";
      };
    }
    {
      name = "is_fullwidth_code_point___is_fullwidth_code_point_1.0.0.tgz";
      path = fetchurl {
        name = "is_fullwidth_code_point___is_fullwidth_code_point_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/is-fullwidth-code-point/-/is-fullwidth-code-point-1.0.0.tgz";
        sha1 = "ef9e31386f031a7f0d643af82fde50c457ef00cb";
      };
    }
    {
      name = "is_fullwidth_code_point___is_fullwidth_code_point_2.0.0.tgz";
      path = fetchurl {
        name = "is_fullwidth_code_point___is_fullwidth_code_point_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/is-fullwidth-code-point/-/is-fullwidth-code-point-2.0.0.tgz";
        sha1 = "a3b30a5c4f199183167aaab93beefae3ddfb654f";
      };
    }
    {
      name = "is_fullwidth_code_point___is_fullwidth_code_point_3.0.0.tgz";
      path = fetchurl {
        name = "is_fullwidth_code_point___is_fullwidth_code_point_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/is-fullwidth-code-point/-/is-fullwidth-code-point-3.0.0.tgz";
        sha1 = "f116f8064fe90b3f7844a38997c0b75051269f1d";
      };
    }
    {
      name = "is_generator_fn___is_generator_fn_2.1.0.tgz";
      path = fetchurl {
        name = "is_generator_fn___is_generator_fn_2.1.0.tgz";
        url  = "https://registry.yarnpkg.com/is-generator-fn/-/is-generator-fn-2.1.0.tgz";
        sha1 = "7d140adc389aaf3011a8f2a2a4cfa6faadffb118";
      };
    }
    {
      name = "is_glob___is_glob_3.1.0.tgz";
      path = fetchurl {
        name = "is_glob___is_glob_3.1.0.tgz";
        url  = "https://registry.yarnpkg.com/is-glob/-/is-glob-3.1.0.tgz";
        sha1 = "7ba5ae24217804ac70707b96922567486cc3e84a";
      };
    }
    {
      name = "is_glob___is_glob_4.0.1.tgz";
      path = fetchurl {
        name = "is_glob___is_glob_4.0.1.tgz";
        url  = "https://registry.yarnpkg.com/is-glob/-/is-glob-4.0.1.tgz";
        sha1 = "7567dbe9f2f5e2467bc77ab83c4a29482407a5dc";
      };
    }
    {
      name = "is_html___is_html_1.1.0.tgz";
      path = fetchurl {
        name = "is_html___is_html_1.1.0.tgz";
        url  = "https://registry.yarnpkg.com/is-html/-/is-html-1.1.0.tgz";
        sha1 = "e04f1c18d39485111396f9a0273eab51af218464";
      };
    }
    {
      name = "is_number___is_number_3.0.0.tgz";
      path = fetchurl {
        name = "is_number___is_number_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/is-number/-/is-number-3.0.0.tgz";
        sha1 = "24fd6201a4782cf50561c810276afc7d12d71195";
      };
    }
    {
      name = "is_number___is_number_7.0.0.tgz";
      path = fetchurl {
        name = "is_number___is_number_7.0.0.tgz";
        url  = "https://registry.yarnpkg.com/is-number/-/is-number-7.0.0.tgz";
        sha1 = "7535345b896734d5f80c4d06c50955527a14f12b";
      };
    }
    {
      name = "is_obj___is_obj_2.0.0.tgz";
      path = fetchurl {
        name = "is_obj___is_obj_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/is-obj/-/is-obj-2.0.0.tgz";
        sha1 = "473fb05d973705e3fd9620545018ca8e22ef4982";
      };
    }
    {
      name = "is_plain_obj___is_plain_obj_1.1.0.tgz";
      path = fetchurl {
        name = "is_plain_obj___is_plain_obj_1.1.0.tgz";
        url  = "https://registry.yarnpkg.com/is-plain-obj/-/is-plain-obj-1.1.0.tgz";
        sha1 = "71a50c8429dfca773c92a390a4a03b39fcd51d3e";
      };
    }
    {
      name = "is_plain_object___is_plain_object_2.0.4.tgz";
      path = fetchurl {
        name = "is_plain_object___is_plain_object_2.0.4.tgz";
        url  = "https://registry.yarnpkg.com/is-plain-object/-/is-plain-object-2.0.4.tgz";
        sha1 = "2c163b3fafb1b606d9d17928f05c2a1c38e07677";
      };
    }
    {
      name = "is_regex___is_regex_1.0.5.tgz";
      path = fetchurl {
        name = "is_regex___is_regex_1.0.5.tgz";
        url  = "https://registry.yarnpkg.com/is-regex/-/is-regex-1.0.5.tgz";
        sha1 = "39d589a358bf18967f726967120b8fc1aed74eae";
      };
    }
    {
      name = "is_resolvable___is_resolvable_1.1.0.tgz";
      path = fetchurl {
        name = "is_resolvable___is_resolvable_1.1.0.tgz";
        url  = "https://registry.yarnpkg.com/is-resolvable/-/is-resolvable-1.1.0.tgz";
        sha1 = "fb18f87ce1feb925169c9a407c19318a3206ed88";
      };
    }
    {
      name = "is_stream___is_stream_1.1.0.tgz";
      path = fetchurl {
        name = "is_stream___is_stream_1.1.0.tgz";
        url  = "https://registry.yarnpkg.com/is-stream/-/is-stream-1.1.0.tgz";
        sha1 = "12d4a3dd4e68e0b79ceb8dbc84173ae80d91ca44";
      };
    }
    {
      name = "is_stream___is_stream_2.0.0.tgz";
      path = fetchurl {
        name = "is_stream___is_stream_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/is-stream/-/is-stream-2.0.0.tgz";
        sha1 = "bde9c32680d6fae04129d6ac9d921ce7815f78e3";
      };
    }
    {
      name = "is_svg___is_svg_3.0.0.tgz";
      path = fetchurl {
        name = "is_svg___is_svg_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/is-svg/-/is-svg-3.0.0.tgz";
        sha1 = "9321dbd29c212e5ca99c4fa9794c714bcafa2f75";
      };
    }
    {
      name = "is_symbol___is_symbol_1.0.3.tgz";
      path = fetchurl {
        name = "is_symbol___is_symbol_1.0.3.tgz";
        url  = "https://registry.yarnpkg.com/is-symbol/-/is-symbol-1.0.3.tgz";
        sha1 = "38e1014b9e6329be0de9d24a414fd7441ec61937";
      };
    }
    {
      name = "is_typedarray___is_typedarray_1.0.0.tgz";
      path = fetchurl {
        name = "is_typedarray___is_typedarray_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/is-typedarray/-/is-typedarray-1.0.0.tgz";
        sha1 = "e479c80858df0c1b11ddda6940f96011fcda4a9a";
      };
    }
    {
      name = "is_url___is_url_1.2.4.tgz";
      path = fetchurl {
        name = "is_url___is_url_1.2.4.tgz";
        url  = "https://registry.yarnpkg.com/is-url/-/is-url-1.2.4.tgz";
        sha1 = "04a4df46d28c4cff3d73d01ff06abeb318a1aa52";
      };
    }
    {
      name = "is_windows___is_windows_1.0.2.tgz";
      path = fetchurl {
        name = "is_windows___is_windows_1.0.2.tgz";
        url  = "https://registry.yarnpkg.com/is-windows/-/is-windows-1.0.2.tgz";
        sha1 = "d1850eb9791ecd18e6182ce12a30f396634bb19d";
      };
    }
    {
      name = "is_wsl___is_wsl_1.1.0.tgz";
      path = fetchurl {
        name = "is_wsl___is_wsl_1.1.0.tgz";
        url  = "https://registry.yarnpkg.com/is-wsl/-/is-wsl-1.1.0.tgz";
        sha1 = "1f16e4aa22b04d1336b66188a66af3c600c3a66d";
      };
    }
    {
      name = "is_wsl___is_wsl_2.1.1.tgz";
      path = fetchurl {
        name = "is_wsl___is_wsl_2.1.1.tgz";
        url  = "https://registry.yarnpkg.com/is-wsl/-/is-wsl-2.1.1.tgz";
        sha1 = "4a1c152d429df3d441669498e2486d3596ebaf1d";
      };
    }
    {
      name = "isarray___isarray_1.0.0.tgz";
      path = fetchurl {
        name = "isarray___isarray_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/isarray/-/isarray-1.0.0.tgz";
        sha1 = "bb935d48582cba168c06834957a54a3e07124f11";
      };
    }
    {
      name = "isarray___isarray_2.0.5.tgz";
      path = fetchurl {
        name = "isarray___isarray_2.0.5.tgz";
        url  = "https://registry.yarnpkg.com/isarray/-/isarray-2.0.5.tgz";
        sha1 = "8af1e4c1221244cc62459faf38940d4e644a5723";
      };
    }
    {
      name = "isexe___isexe_2.0.0.tgz";
      path = fetchurl {
        name = "isexe___isexe_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/isexe/-/isexe-2.0.0.tgz";
        sha1 = "e8fbf374dc556ff8947a10dcb0572d633f2cfa10";
      };
    }
    {
      name = "isobject___isobject_2.1.0.tgz";
      path = fetchurl {
        name = "isobject___isobject_2.1.0.tgz";
        url  = "https://registry.yarnpkg.com/isobject/-/isobject-2.1.0.tgz";
        sha1 = "f065561096a3f1da2ef46272f815c840d87e0c89";
      };
    }
    {
      name = "isobject___isobject_3.0.1.tgz";
      path = fetchurl {
        name = "isobject___isobject_3.0.1.tgz";
        url  = "https://registry.yarnpkg.com/isobject/-/isobject-3.0.1.tgz";
        sha1 = "4e431e92b11a9731636aa1f9c8d1ccbcfdab78df";
      };
    }
    {
      name = "isomorphic_fetch___isomorphic_fetch_2.2.1.tgz";
      path = fetchurl {
        name = "isomorphic_fetch___isomorphic_fetch_2.2.1.tgz";
        url  = "https://registry.yarnpkg.com/isomorphic-fetch/-/isomorphic-fetch-2.2.1.tgz";
        sha1 = "611ae1acf14f5e81f729507472819fe9733558a9";
      };
    }
    {
      name = "isstream___isstream_0.1.2.tgz";
      path = fetchurl {
        name = "isstream___isstream_0.1.2.tgz";
        url  = "https://registry.yarnpkg.com/isstream/-/isstream-0.1.2.tgz";
        sha1 = "47e63f7af55afa6f92e1500e690eb8b8529c099a";
      };
    }
    {
      name = "istanbul_lib_coverage___istanbul_lib_coverage_3.0.0.tgz";
      path = fetchurl {
        name = "istanbul_lib_coverage___istanbul_lib_coverage_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/istanbul-lib-coverage/-/istanbul-lib-coverage-3.0.0.tgz";
        sha1 = "f5944a37c70b550b02a78a5c3b2055b280cec8ec";
      };
    }
    {
      name = "istanbul_lib_instrument___istanbul_lib_instrument_4.0.1.tgz";
      path = fetchurl {
        name = "istanbul_lib_instrument___istanbul_lib_instrument_4.0.1.tgz";
        url  = "https://registry.yarnpkg.com/istanbul-lib-instrument/-/istanbul-lib-instrument-4.0.1.tgz";
        sha1 = "61f13ac2c96cfefb076fe7131156cc05907874e6";
      };
    }
    {
      name = "istanbul_lib_report___istanbul_lib_report_3.0.0.tgz";
      path = fetchurl {
        name = "istanbul_lib_report___istanbul_lib_report_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/istanbul-lib-report/-/istanbul-lib-report-3.0.0.tgz";
        sha1 = "7518fe52ea44de372f460a76b5ecda9ffb73d8a6";
      };
    }
    {
      name = "istanbul_lib_source_maps___istanbul_lib_source_maps_4.0.0.tgz";
      path = fetchurl {
        name = "istanbul_lib_source_maps___istanbul_lib_source_maps_4.0.0.tgz";
        url  = "https://registry.yarnpkg.com/istanbul-lib-source-maps/-/istanbul-lib-source-maps-4.0.0.tgz";
        sha1 = "75743ce6d96bb86dc7ee4352cf6366a23f0b1ad9";
      };
    }
    {
      name = "istanbul_reports___istanbul_reports_3.0.2.tgz";
      path = fetchurl {
        name = "istanbul_reports___istanbul_reports_3.0.2.tgz";
        url  = "https://registry.yarnpkg.com/istanbul-reports/-/istanbul-reports-3.0.2.tgz";
        sha1 = "d593210e5000683750cb09fc0644e4b6e27fd53b";
      };
    }
    {
      name = "iterall___iterall_1.3.0.tgz";
      path = fetchurl {
        name = "iterall___iterall_1.3.0.tgz";
        url  = "https://registry.yarnpkg.com/iterall/-/iterall-1.3.0.tgz";
        sha1 = "afcb08492e2915cbd8a0884eb93a8c94d0d72fea";
      };
    }
    {
      name = "javascript_natural_sort___javascript_natural_sort_0.7.1.tgz";
      path = fetchurl {
        name = "javascript_natural_sort___javascript_natural_sort_0.7.1.tgz";
        url  = "https://registry.yarnpkg.com/javascript-natural-sort/-/javascript-natural-sort-0.7.1.tgz";
        sha1 = "f9e2303d4507f6d74355a73664d1440fb5a0ef59";
      };
    }
    {
      name = "jest_changed_files___jest_changed_files_25.5.0.tgz";
      path = fetchurl {
        name = "jest_changed_files___jest_changed_files_25.5.0.tgz";
        url  = "https://registry.yarnpkg.com/jest-changed-files/-/jest-changed-files-25.5.0.tgz";
        sha1 = "141cc23567ceb3f534526f8614ba39421383634c";
      };
    }
    {
      name = "jest_cli___jest_cli_25.5.2.tgz";
      path = fetchurl {
        name = "jest_cli___jest_cli_25.5.2.tgz";
        url  = "https://registry.yarnpkg.com/jest-cli/-/jest-cli-25.5.2.tgz";
        sha1 = "44ffb68cc0aa1a4b2971b8bfd07083397232105e";
      };
    }
    {
      name = "jest_config___jest_config_25.5.2.tgz";
      path = fetchurl {
        name = "jest_config___jest_config_25.5.2.tgz";
        url  = "https://registry.yarnpkg.com/jest-config/-/jest-config-25.5.2.tgz";
        sha1 = "99319256123df19194da4aa27bb695ace4dfbe6b";
      };
    }
    {
      name = "jest_diff___jest_diff_25.5.0.tgz";
      path = fetchurl {
        name = "jest_diff___jest_diff_25.5.0.tgz";
        url  = "https://registry.yarnpkg.com/jest-diff/-/jest-diff-25.5.0.tgz";
        sha1 = "1dd26ed64f96667c068cef026b677dfa01afcfa9";
      };
    }
    {
      name = "jest_docblock___jest_docblock_25.3.0.tgz";
      path = fetchurl {
        name = "jest_docblock___jest_docblock_25.3.0.tgz";
        url  = "https://registry.yarnpkg.com/jest-docblock/-/jest-docblock-25.3.0.tgz";
        sha1 = "8b777a27e3477cd77a168c05290c471a575623ef";
      };
    }
    {
      name = "jest_each___jest_each_25.5.0.tgz";
      path = fetchurl {
        name = "jest_each___jest_each_25.5.0.tgz";
        url  = "https://registry.yarnpkg.com/jest-each/-/jest-each-25.5.0.tgz";
        sha1 = "0c3c2797e8225cb7bec7e4d249dcd96b934be516";
      };
    }
    {
      name = "jest_environment_jsdom___jest_environment_jsdom_25.5.0.tgz";
      path = fetchurl {
        name = "jest_environment_jsdom___jest_environment_jsdom_25.5.0.tgz";
        url  = "https://registry.yarnpkg.com/jest-environment-jsdom/-/jest-environment-jsdom-25.5.0.tgz";
        sha1 = "dcbe4da2ea997707997040ecf6e2560aec4e9834";
      };
    }
    {
      name = "jest_environment_node___jest_environment_node_25.5.0.tgz";
      path = fetchurl {
        name = "jest_environment_node___jest_environment_node_25.5.0.tgz";
        url  = "https://registry.yarnpkg.com/jest-environment-node/-/jest-environment-node-25.5.0.tgz";
        sha1 = "0f55270d94804902988e64adca37c6ce0f7d07a1";
      };
    }
    {
      name = "jest_get_type___jest_get_type_25.2.6.tgz";
      path = fetchurl {
        name = "jest_get_type___jest_get_type_25.2.6.tgz";
        url  = "https://registry.yarnpkg.com/jest-get-type/-/jest-get-type-25.2.6.tgz";
        sha1 = "0b0a32fab8908b44d508be81681487dbabb8d877";
      };
    }
    {
      name = "jest_haste_map___jest_haste_map_25.5.1.tgz";
      path = fetchurl {
        name = "jest_haste_map___jest_haste_map_25.5.1.tgz";
        url  = "https://registry.yarnpkg.com/jest-haste-map/-/jest-haste-map-25.5.1.tgz";
        sha1 = "1df10f716c1d94e60a1ebf7798c9fb3da2620943";
      };
    }
    {
      name = "jest_jasmine2___jest_jasmine2_25.5.2.tgz";
      path = fetchurl {
        name = "jest_jasmine2___jest_jasmine2_25.5.2.tgz";
        url  = "https://registry.yarnpkg.com/jest-jasmine2/-/jest-jasmine2-25.5.2.tgz";
        sha1 = "ea7825e965309ccfa610435f8a23a663339f8e44";
      };
    }
    {
      name = "jest_leak_detector___jest_leak_detector_25.5.0.tgz";
      path = fetchurl {
        name = "jest_leak_detector___jest_leak_detector_25.5.0.tgz";
        url  = "https://registry.yarnpkg.com/jest-leak-detector/-/jest-leak-detector-25.5.0.tgz";
        sha1 = "2291c6294b0ce404241bb56fe60e2d0c3e34f0bb";
      };
    }
    {
      name = "jest_matcher_utils___jest_matcher_utils_25.5.0.tgz";
      path = fetchurl {
        name = "jest_matcher_utils___jest_matcher_utils_25.5.0.tgz";
        url  = "https://registry.yarnpkg.com/jest-matcher-utils/-/jest-matcher-utils-25.5.0.tgz";
        sha1 = "fbc98a12d730e5d2453d7f1ed4a4d948e34b7867";
      };
    }
    {
      name = "jest_message_util___jest_message_util_25.5.0.tgz";
      path = fetchurl {
        name = "jest_message_util___jest_message_util_25.5.0.tgz";
        url  = "https://registry.yarnpkg.com/jest-message-util/-/jest-message-util-25.5.0.tgz";
        sha1 = "ea11d93204cc7ae97456e1d8716251185b8880ea";
      };
    }
    {
      name = "jest_mock___jest_mock_25.5.0.tgz";
      path = fetchurl {
        name = "jest_mock___jest_mock_25.5.0.tgz";
        url  = "https://registry.yarnpkg.com/jest-mock/-/jest-mock-25.5.0.tgz";
        sha1 = "a91a54dabd14e37ecd61665d6b6e06360a55387a";
      };
    }
    {
      name = "jest_pnp_resolver___jest_pnp_resolver_1.2.1.tgz";
      path = fetchurl {
        name = "jest_pnp_resolver___jest_pnp_resolver_1.2.1.tgz";
        url  = "https://registry.yarnpkg.com/jest-pnp-resolver/-/jest-pnp-resolver-1.2.1.tgz";
        sha1 = "ecdae604c077a7fbc70defb6d517c3c1c898923a";
      };
    }
    {
      name = "jest_regex_util___jest_regex_util_25.2.6.tgz";
      path = fetchurl {
        name = "jest_regex_util___jest_regex_util_25.2.6.tgz";
        url  = "https://registry.yarnpkg.com/jest-regex-util/-/jest-regex-util-25.2.6.tgz";
        sha1 = "d847d38ba15d2118d3b06390056028d0f2fd3964";
      };
    }
    {
      name = "jest_resolve_dependencies___jest_resolve_dependencies_25.5.2.tgz";
      path = fetchurl {
        name = "jest_resolve_dependencies___jest_resolve_dependencies_25.5.2.tgz";
        url  = "https://registry.yarnpkg.com/jest-resolve-dependencies/-/jest-resolve-dependencies-25.5.2.tgz";
        sha1 = "7409d14437497339e0acb88575408f2265c9a58d";
      };
    }
    {
      name = "jest_resolve___jest_resolve_25.5.1.tgz";
      path = fetchurl {
        name = "jest_resolve___jest_resolve_25.5.1.tgz";
        url  = "https://registry.yarnpkg.com/jest-resolve/-/jest-resolve-25.5.1.tgz";
        sha1 = "0e6fbcfa7c26d2a5fe8f456088dc332a79266829";
      };
    }
    {
      name = "jest_runner___jest_runner_25.5.2.tgz";
      path = fetchurl {
        name = "jest_runner___jest_runner_25.5.2.tgz";
        url  = "https://registry.yarnpkg.com/jest-runner/-/jest-runner-25.5.2.tgz";
        sha1 = "af9b50736d834b9892fd240e89c984712cf53dd6";
      };
    }
    {
      name = "jest_runtime___jest_runtime_25.5.2.tgz";
      path = fetchurl {
        name = "jest_runtime___jest_runtime_25.5.2.tgz";
        url  = "https://registry.yarnpkg.com/jest-runtime/-/jest-runtime-25.5.2.tgz";
        sha1 = "cf98a455e15f86120a0bf4dbf494b2e54a0a20dc";
      };
    }
    {
      name = "jest_serializer___jest_serializer_25.5.0.tgz";
      path = fetchurl {
        name = "jest_serializer___jest_serializer_25.5.0.tgz";
        url  = "https://registry.yarnpkg.com/jest-serializer/-/jest-serializer-25.5.0.tgz";
        sha1 = "a993f484e769b4ed54e70e0efdb74007f503072b";
      };
    }
    {
      name = "jest_snapshot___jest_snapshot_25.5.1.tgz";
      path = fetchurl {
        name = "jest_snapshot___jest_snapshot_25.5.1.tgz";
        url  = "https://registry.yarnpkg.com/jest-snapshot/-/jest-snapshot-25.5.1.tgz";
        sha1 = "1a2a576491f9961eb8d00c2e5fd479bc28e5ff7f";
      };
    }
    {
      name = "jest_util___jest_util_25.5.0.tgz";
      path = fetchurl {
        name = "jest_util___jest_util_25.5.0.tgz";
        url  = "https://registry.yarnpkg.com/jest-util/-/jest-util-25.5.0.tgz";
        sha1 = "31c63b5d6e901274d264a4fec849230aa3fa35b0";
      };
    }
    {
      name = "jest_validate___jest_validate_25.5.0.tgz";
      path = fetchurl {
        name = "jest_validate___jest_validate_25.5.0.tgz";
        url  = "https://registry.yarnpkg.com/jest-validate/-/jest-validate-25.5.0.tgz";
        sha1 = "fb4c93f332c2e4cf70151a628e58a35e459a413a";
      };
    }
    {
      name = "jest_watcher___jest_watcher_25.5.0.tgz";
      path = fetchurl {
        name = "jest_watcher___jest_watcher_25.5.0.tgz";
        url  = "https://registry.yarnpkg.com/jest-watcher/-/jest-watcher-25.5.0.tgz";
        sha1 = "d6110d101df98badebe435003956fd4a465e8456";
      };
    }
    {
      name = "jest_worker___jest_worker_25.5.0.tgz";
      path = fetchurl {
        name = "jest_worker___jest_worker_25.5.0.tgz";
        url  = "https://registry.yarnpkg.com/jest-worker/-/jest-worker-25.5.0.tgz";
        sha1 = "2611d071b79cea0f43ee57a3d118593ac1547db1";
      };
    }
    {
      name = "jest___jest_25.5.2.tgz";
      path = fetchurl {
        name = "jest___jest_25.5.2.tgz";
        url  = "https://registry.yarnpkg.com/jest/-/jest-25.5.2.tgz";
        sha1 = "9b90c64b0d3d1fadb796e4e6f7f7a6c7d5282190";
      };
    }
    {
      name = "js_beautify___js_beautify_1.11.0.tgz";
      path = fetchurl {
        name = "js_beautify___js_beautify_1.11.0.tgz";
        url  = "https://registry.yarnpkg.com/js-beautify/-/js-beautify-1.11.0.tgz";
        sha1 = "afb873dc47d58986360093dcb69951e8bcd5ded2";
      };
    }
    {
      name = "js_cookie___js_cookie_2.2.1.tgz";
      path = fetchurl {
        name = "js_cookie___js_cookie_2.2.1.tgz";
        url  = "https://registry.yarnpkg.com/js-cookie/-/js-cookie-2.2.1.tgz";
        sha1 = "69e106dc5d5806894562902aa5baec3744e9b2b8";
      };
    }
    {
      name = "js_levenshtein___js_levenshtein_1.1.6.tgz";
      path = fetchurl {
        name = "js_levenshtein___js_levenshtein_1.1.6.tgz";
        url  = "https://registry.yarnpkg.com/js-levenshtein/-/js-levenshtein-1.1.6.tgz";
        sha1 = "c6cee58eb3550372df8deb85fad5ce66ce01d59d";
      };
    }
    {
      name = "js_tokens___js_tokens_4.0.0.tgz";
      path = fetchurl {
        name = "js_tokens___js_tokens_4.0.0.tgz";
        url  = "https://registry.yarnpkg.com/js-tokens/-/js-tokens-4.0.0.tgz";
        sha1 = "19203fb59991df98e3a287050d4647cdeaf32499";
      };
    }
    {
      name = "js_tokens___js_tokens_3.0.2.tgz";
      path = fetchurl {
        name = "js_tokens___js_tokens_3.0.2.tgz";
        url  = "https://registry.yarnpkg.com/js-tokens/-/js-tokens-3.0.2.tgz";
        sha1 = "9866df395102130e38f7f996bceb65443209c25b";
      };
    }
    {
      name = "js_yaml___js_yaml_3.13.1.tgz";
      path = fetchurl {
        name = "js_yaml___js_yaml_3.13.1.tgz";
        url  = "https://registry.yarnpkg.com/js-yaml/-/js-yaml-3.13.1.tgz";
        sha1 = "aff151b30bfdfa8e49e05da22e7415e9dfa37847";
      };
    }
    {
      name = "jsbn___jsbn_0.1.1.tgz";
      path = fetchurl {
        name = "jsbn___jsbn_0.1.1.tgz";
        url  = "https://registry.yarnpkg.com/jsbn/-/jsbn-0.1.1.tgz";
        sha1 = "a5e654c2e5a2deb5f201d96cefbca80c0ef2f513";
      };
    }
    {
      name = "jsdom___jsdom_14.1.0.tgz";
      path = fetchurl {
        name = "jsdom___jsdom_14.1.0.tgz";
        url  = "https://registry.yarnpkg.com/jsdom/-/jsdom-14.1.0.tgz";
        sha1 = "916463b6094956b0a6c1782c94e380cd30e1981b";
      };
    }
    {
      name = "jsdom___jsdom_15.2.1.tgz";
      path = fetchurl {
        name = "jsdom___jsdom_15.2.1.tgz";
        url  = "https://registry.yarnpkg.com/jsdom/-/jsdom-15.2.1.tgz";
        sha1 = "d2feb1aef7183f86be521b8c6833ff5296d07ec5";
      };
    }
    {
      name = "jsesc___jsesc_2.5.2.tgz";
      path = fetchurl {
        name = "jsesc___jsesc_2.5.2.tgz";
        url  = "https://registry.yarnpkg.com/jsesc/-/jsesc-2.5.2.tgz";
        sha1 = "80564d2e483dacf6e8ef209650a67df3f0c283a4";
      };
    }
    {
      name = "jsesc___jsesc_0.5.0.tgz";
      path = fetchurl {
        name = "jsesc___jsesc_0.5.0.tgz";
        url  = "https://registry.yarnpkg.com/jsesc/-/jsesc-0.5.0.tgz";
        sha1 = "e7dee66e35d6fc16f710fe91d5cf69f70f08911d";
      };
    }
    {
      name = "json_parse_better_errors___json_parse_better_errors_1.0.2.tgz";
      path = fetchurl {
        name = "json_parse_better_errors___json_parse_better_errors_1.0.2.tgz";
        url  = "https://registry.yarnpkg.com/json-parse-better-errors/-/json-parse-better-errors-1.0.2.tgz";
        sha1 = "bb867cfb3450e69107c131d1c514bab3dc8bcaa9";
      };
    }
    {
      name = "json_schema_traverse___json_schema_traverse_0.4.1.tgz";
      path = fetchurl {
        name = "json_schema_traverse___json_schema_traverse_0.4.1.tgz";
        url  = "https://registry.yarnpkg.com/json-schema-traverse/-/json-schema-traverse-0.4.1.tgz";
        sha1 = "69f6a87d9513ab8bb8fe63bdb0979c448e684660";
      };
    }
    {
      name = "json_schema___json_schema_0.2.3.tgz";
      path = fetchurl {
        name = "json_schema___json_schema_0.2.3.tgz";
        url  = "https://registry.yarnpkg.com/json-schema/-/json-schema-0.2.3.tgz";
        sha1 = "b480c892e59a2f05954ce727bd3f2a4e882f9e13";
      };
    }
    {
      name = "json_stringify_pretty_compact___json_stringify_pretty_compact_2.0.0.tgz";
      path = fetchurl {
        name = "json_stringify_pretty_compact___json_stringify_pretty_compact_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/json-stringify-pretty-compact/-/json-stringify-pretty-compact-2.0.0.tgz";
        sha1 = "e77c419f52ff00c45a31f07f4c820c2433143885";
      };
    }
    {
      name = "json_stringify_safe___json_stringify_safe_5.0.1.tgz";
      path = fetchurl {
        name = "json_stringify_safe___json_stringify_safe_5.0.1.tgz";
        url  = "https://registry.yarnpkg.com/json-stringify-safe/-/json-stringify-safe-5.0.1.tgz";
        sha1 = "1296a2d58fd45f19a0f6ce01d65701e2c735b6eb";
      };
    }
    {
      name = "json2mq___json2mq_0.2.0.tgz";
      path = fetchurl {
        name = "json2mq___json2mq_0.2.0.tgz";
        url  = "https://registry.yarnpkg.com/json2mq/-/json2mq-0.2.0.tgz";
        sha1 = "b637bd3ba9eabe122c83e9720483aeb10d2c904a";
      };
    }
    {
      name = "json5___json5_1.0.1.tgz";
      path = fetchurl {
        name = "json5___json5_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/json5/-/json5-1.0.1.tgz";
        sha1 = "779fb0018604fa854eacbf6252180d83543e3dbe";
      };
    }
    {
      name = "json5___json5_2.1.3.tgz";
      path = fetchurl {
        name = "json5___json5_2.1.3.tgz";
        url  = "https://registry.yarnpkg.com/json5/-/json5-2.1.3.tgz";
        sha1 = "c9b0f7fa9233bfe5807fe66fcf3a5617ed597d43";
      };
    }
    {
      name = "jsonfile___jsonfile_4.0.0.tgz";
      path = fetchurl {
        name = "jsonfile___jsonfile_4.0.0.tgz";
        url  = "https://registry.yarnpkg.com/jsonfile/-/jsonfile-4.0.0.tgz";
        sha1 = "8771aae0799b64076b76640fca058f9c10e33ecb";
      };
    }
    {
      name = "jsprim___jsprim_1.4.1.tgz";
      path = fetchurl {
        name = "jsprim___jsprim_1.4.1.tgz";
        url  = "https://registry.yarnpkg.com/jsprim/-/jsprim-1.4.1.tgz";
        sha1 = "313e66bc1e5cc06e438bc1b7499c2e5c56acb6a2";
      };
    }
    {
      name = "jstat___jstat_1.9.0.tgz";
      path = fetchurl {
        name = "jstat___jstat_1.9.0.tgz";
        url  = "https://registry.yarnpkg.com/jstat/-/jstat-1.9.0.tgz";
        sha1 = "96a625f5697566f6ba3b15832fb371f9451b8614";
      };
    }
    {
      name = "jstat___jstat_1.9.2.tgz";
      path = fetchurl {
        name = "jstat___jstat_1.9.2.tgz";
        url  = "https://registry.yarnpkg.com/jstat/-/jstat-1.9.2.tgz";
        sha1 = "cd2d24df200fd3488861dc7868be01ff65a238cc";
      };
    }
    {
      name = "kind_of___kind_of_3.2.2.tgz";
      path = fetchurl {
        name = "kind_of___kind_of_3.2.2.tgz";
        url  = "https://registry.yarnpkg.com/kind-of/-/kind-of-3.2.2.tgz";
        sha1 = "31ea21a734bab9bbb0f32466d893aea51e4a3c64";
      };
    }
    {
      name = "kind_of___kind_of_4.0.0.tgz";
      path = fetchurl {
        name = "kind_of___kind_of_4.0.0.tgz";
        url  = "https://registry.yarnpkg.com/kind-of/-/kind-of-4.0.0.tgz";
        sha1 = "20813df3d712928b207378691a45066fae72dd57";
      };
    }
    {
      name = "kind_of___kind_of_5.1.0.tgz";
      path = fetchurl {
        name = "kind_of___kind_of_5.1.0.tgz";
        url  = "https://registry.yarnpkg.com/kind-of/-/kind-of-5.1.0.tgz";
        sha1 = "729c91e2d857b7a419a1f9aa65685c4c33f5845d";
      };
    }
    {
      name = "kind_of___kind_of_6.0.3.tgz";
      path = fetchurl {
        name = "kind_of___kind_of_6.0.3.tgz";
        url  = "https://registry.yarnpkg.com/kind-of/-/kind-of-6.0.3.tgz";
        sha1 = "07c05034a6c349fa06e24fa35aa76db4580ce4dd";
      };
    }
    {
      name = "kleur___kleur_3.0.3.tgz";
      path = fetchurl {
        name = "kleur___kleur_3.0.3.tgz";
        url  = "https://registry.yarnpkg.com/kleur/-/kleur-3.0.3.tgz";
        sha1 = "a79c9ecc86ee1ce3fa6206d1216c501f147fc07e";
      };
    }
    {
      name = "lcid___lcid_2.0.0.tgz";
      path = fetchurl {
        name = "lcid___lcid_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/lcid/-/lcid-2.0.0.tgz";
        sha1 = "6ef5d2df60e52f82eb228a4c373e8d1f397253cf";
      };
    }
    {
      name = "lenses_ppx___lenses_ppx_5.1.0.tgz";
      path = fetchurl {
        name = "lenses_ppx___lenses_ppx_5.1.0.tgz";
        url  = "https://registry.yarnpkg.com/lenses-ppx/-/lenses-ppx-5.1.0.tgz";
        sha1 = "74882abc99f09fdb03daf33fd4ee79272424be7a";
      };
    }
    {
      name = "less___less_3.10.3.tgz";
      path = fetchurl {
        name = "less___less_3.10.3.tgz";
        url  = "https://registry.yarnpkg.com/less/-/less-3.10.3.tgz";
        sha1 = "417a0975d5eeecc52cff4bcfa3c09d35781e6792";
      };
    }
    {
      name = "leven___leven_3.1.0.tgz";
      path = fetchurl {
        name = "leven___leven_3.1.0.tgz";
        url  = "https://registry.yarnpkg.com/leven/-/leven-3.1.0.tgz";
        sha1 = "77891de834064cccba82ae7842bb6b14a13ed7f2";
      };
    }
    {
      name = "levenary___levenary_1.1.1.tgz";
      path = fetchurl {
        name = "levenary___levenary_1.1.1.tgz";
        url  = "https://registry.yarnpkg.com/levenary/-/levenary-1.1.1.tgz";
        sha1 = "842a9ee98d2075aa7faeedbe32679e9205f46f77";
      };
    }
    {
      name = "levn___levn_0.3.0.tgz";
      path = fetchurl {
        name = "levn___levn_0.3.0.tgz";
        url  = "https://registry.yarnpkg.com/levn/-/levn-0.3.0.tgz";
        sha1 = "3b09924edf9f083c0490fdd4c0bc4421e04764ee";
      };
    }
    {
      name = "lines_and_columns___lines_and_columns_1.1.6.tgz";
      path = fetchurl {
        name = "lines_and_columns___lines_and_columns_1.1.6.tgz";
        url  = "https://registry.yarnpkg.com/lines-and-columns/-/lines-and-columns-1.1.6.tgz";
        sha1 = "1c00c743b433cd0a4e80758f7b64a57440d9ff00";
      };
    }
    {
      name = "locate_path___locate_path_2.0.0.tgz";
      path = fetchurl {
        name = "locate_path___locate_path_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/locate-path/-/locate-path-2.0.0.tgz";
        sha1 = "2b568b265eec944c6d9c0de9c3dbbbca0354cd8e";
      };
    }
    {
      name = "locate_path___locate_path_3.0.0.tgz";
      path = fetchurl {
        name = "locate_path___locate_path_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/locate-path/-/locate-path-3.0.0.tgz";
        sha1 = "dbec3b3ab759758071b58fe59fc41871af21400e";
      };
    }
    {
      name = "locate_path___locate_path_5.0.0.tgz";
      path = fetchurl {
        name = "locate_path___locate_path_5.0.0.tgz";
        url  = "https://registry.yarnpkg.com/locate-path/-/locate-path-5.0.0.tgz";
        sha1 = "1afba396afd676a6d42504d0a67a3a7eb9f62aa0";
      };
    }
    {
      name = "lodash.clone___lodash.clone_4.5.0.tgz";
      path = fetchurl {
        name = "lodash.clone___lodash.clone_4.5.0.tgz";
        url  = "https://registry.yarnpkg.com/lodash.clone/-/lodash.clone-4.5.0.tgz";
        sha1 = "195870450f5a13192478df4bc3d23d2dea1907b6";
      };
    }
    {
      name = "lodash.debounce___lodash.debounce_4.0.8.tgz";
      path = fetchurl {
        name = "lodash.debounce___lodash.debounce_4.0.8.tgz";
        url  = "https://registry.yarnpkg.com/lodash.debounce/-/lodash.debounce-4.0.8.tgz";
        sha1 = "82d79bff30a67c4005ffd5e2515300ad9ca4d7af";
      };
    }
    {
      name = "lodash.get___lodash.get_4.4.2.tgz";
      path = fetchurl {
        name = "lodash.get___lodash.get_4.4.2.tgz";
        url  = "https://registry.yarnpkg.com/lodash.get/-/lodash.get-4.4.2.tgz";
        sha1 = "2d177f652fa31e939b4438d5341499dfa3825e99";
      };
    }
    {
      name = "lodash.isequal___lodash.isequal_4.5.0.tgz";
      path = fetchurl {
        name = "lodash.isequal___lodash.isequal_4.5.0.tgz";
        url  = "https://registry.yarnpkg.com/lodash.isequal/-/lodash.isequal-4.5.0.tgz";
        sha1 = "415c4478f2bcc30120c22ce10ed3226f7d3e18e0";
      };
    }
    {
      name = "lodash.memoize___lodash.memoize_4.1.2.tgz";
      path = fetchurl {
        name = "lodash.memoize___lodash.memoize_4.1.2.tgz";
        url  = "https://registry.yarnpkg.com/lodash.memoize/-/lodash.memoize-4.1.2.tgz";
        sha1 = "bcc6c49a42a2840ed997f323eada5ecd182e0bfe";
      };
    }
    {
      name = "lodash.sortby___lodash.sortby_4.7.0.tgz";
      path = fetchurl {
        name = "lodash.sortby___lodash.sortby_4.7.0.tgz";
        url  = "https://registry.yarnpkg.com/lodash.sortby/-/lodash.sortby-4.7.0.tgz";
        sha1 = "edd14c824e2cc9c1e0b0a1b42bb5210516a42438";
      };
    }
    {
      name = "lodash.throttle___lodash.throttle_4.1.1.tgz";
      path = fetchurl {
        name = "lodash.throttle___lodash.throttle_4.1.1.tgz";
        url  = "https://registry.yarnpkg.com/lodash.throttle/-/lodash.throttle-4.1.1.tgz";
        sha1 = "c23e91b710242ac70c37f1e1cda9274cc39bf2f4";
      };
    }
    {
      name = "lodash.toarray___lodash.toarray_4.4.0.tgz";
      path = fetchurl {
        name = "lodash.toarray___lodash.toarray_4.4.0.tgz";
        url  = "https://registry.yarnpkg.com/lodash.toarray/-/lodash.toarray-4.4.0.tgz";
        sha1 = "24c4bfcd6b2fba38bfd0594db1179d8e9b656561";
      };
    }
    {
      name = "lodash.uniq___lodash.uniq_4.5.0.tgz";
      path = fetchurl {
        name = "lodash.uniq___lodash.uniq_4.5.0.tgz";
        url  = "https://registry.yarnpkg.com/lodash.uniq/-/lodash.uniq-4.5.0.tgz";
        sha1 = "d0225373aeb652adc1bc82e4945339a842754773";
      };
    }
    {
      name = "lodash___lodash_4.17.15.tgz";
      path = fetchurl {
        name = "lodash___lodash_4.17.15.tgz";
        url  = "https://registry.yarnpkg.com/lodash/-/lodash-4.17.15.tgz";
        sha1 = "b447f6670a0455bbfeedd11392eff330ea097548";
      };
    }
    {
      name = "log_symbols___log_symbols_2.2.0.tgz";
      path = fetchurl {
        name = "log_symbols___log_symbols_2.2.0.tgz";
        url  = "https://registry.yarnpkg.com/log-symbols/-/log-symbols-2.2.0.tgz";
        sha1 = "5740e1c5d6f0dfda4ad9323b5332107ef6b4c40a";
      };
    }
    {
      name = "lolex___lolex_5.1.2.tgz";
      path = fetchurl {
        name = "lolex___lolex_5.1.2.tgz";
        url  = "https://registry.yarnpkg.com/lolex/-/lolex-5.1.2.tgz";
        sha1 = "953694d098ce7c07bc5ed6d0e42bc6c0c6d5a367";
      };
    }
    {
      name = "loose_envify___loose_envify_1.4.0.tgz";
      path = fetchurl {
        name = "loose_envify___loose_envify_1.4.0.tgz";
        url  = "https://registry.yarnpkg.com/loose-envify/-/loose-envify-1.4.0.tgz";
        sha1 = "71ee51fa7be4caec1a63839f7e682d8132d30caf";
      };
    }
    {
      name = "lower_case___lower_case_1.1.4.tgz";
      path = fetchurl {
        name = "lower_case___lower_case_1.1.4.tgz";
        url  = "https://registry.yarnpkg.com/lower-case/-/lower-case-1.1.4.tgz";
        sha1 = "9a2cabd1b9e8e0ae993a4bf7d5875c39c42e8eac";
      };
    }
    {
      name = "lru_cache___lru_cache_4.1.5.tgz";
      path = fetchurl {
        name = "lru_cache___lru_cache_4.1.5.tgz";
        url  = "https://registry.yarnpkg.com/lru-cache/-/lru-cache-4.1.5.tgz";
        sha1 = "8bbe50ea85bed59bc9e33dcab8235ee9bcf443cd";
      };
    }
    {
      name = "magic_string___magic_string_0.22.5.tgz";
      path = fetchurl {
        name = "magic_string___magic_string_0.22.5.tgz";
        url  = "https://registry.yarnpkg.com/magic-string/-/magic-string-0.22.5.tgz";
        sha1 = "8e9cf5afddf44385c1da5bc2a6a0dbd10b03657e";
      };
    }
    {
      name = "make_dir___make_dir_3.1.0.tgz";
      path = fetchurl {
        name = "make_dir___make_dir_3.1.0.tgz";
        url  = "https://registry.yarnpkg.com/make-dir/-/make-dir-3.1.0.tgz";
        sha1 = "415e967046b3a7f1d185277d84aa58203726a13f";
      };
    }
    {
      name = "makeerror___makeerror_1.0.11.tgz";
      path = fetchurl {
        name = "makeerror___makeerror_1.0.11.tgz";
        url  = "https://registry.yarnpkg.com/makeerror/-/makeerror-1.0.11.tgz";
        sha1 = "e01a5c9109f2af79660e4e8b9587790184f5a96c";
      };
    }
    {
      name = "map_age_cleaner___map_age_cleaner_0.1.3.tgz";
      path = fetchurl {
        name = "map_age_cleaner___map_age_cleaner_0.1.3.tgz";
        url  = "https://registry.yarnpkg.com/map-age-cleaner/-/map-age-cleaner-0.1.3.tgz";
        sha1 = "7d583a7306434c055fe474b0f45078e6e1b4b92a";
      };
    }
    {
      name = "map_cache___map_cache_0.2.2.tgz";
      path = fetchurl {
        name = "map_cache___map_cache_0.2.2.tgz";
        url  = "https://registry.yarnpkg.com/map-cache/-/map-cache-0.2.2.tgz";
        sha1 = "c32abd0bd6525d9b051645bb4f26ac5dc98a0dbf";
      };
    }
    {
      name = "map_visit___map_visit_1.0.0.tgz";
      path = fetchurl {
        name = "map_visit___map_visit_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/map-visit/-/map-visit-1.0.0.tgz";
        sha1 = "ecdca8f13144e660f1b5bd41f12f3479d98dfb8f";
      };
    }
    {
      name = "marked___marked_1.2.9.tgz";
      path = fetchurl {
        name = "marked___marked_1.2.9.tgz";
        url  = "https://registry.yarnpkg.com/marked/-/marked-1.2.9.tgz";
        sha1 = "53786f8b05d4c01a2a5a76b7d1ec9943d29d72dc";
      };
    }
    {
      name = "mathjs___mathjs_5.10.3.tgz";
      path = fetchurl {
        name = "mathjs___mathjs_5.10.3.tgz";
        url  = "https://registry.yarnpkg.com/mathjs/-/mathjs-5.10.3.tgz";
        sha1 = "e998885f932ea8886db8b40f7f5b199f89b427f1";
      };
    }
    {
      name = "md5.js___md5.js_1.3.5.tgz";
      path = fetchurl {
        name = "md5.js___md5.js_1.3.5.tgz";
        url  = "https://registry.yarnpkg.com/md5.js/-/md5.js-1.3.5.tgz";
        sha1 = "b5d07b8e3216e3e27cd728d72f70d1e6a342005f";
      };
    }
    {
      name = "mdn_data___mdn_data_2.0.4.tgz";
      path = fetchurl {
        name = "mdn_data___mdn_data_2.0.4.tgz";
        url  = "https://registry.yarnpkg.com/mdn-data/-/mdn-data-2.0.4.tgz";
        sha1 = "699b3c38ac6f1d728091a64650b65d388502fd5b";
      };
    }
    {
      name = "mdn_data___mdn_data_2.0.6.tgz";
      path = fetchurl {
        name = "mdn_data___mdn_data_2.0.6.tgz";
        url  = "https://registry.yarnpkg.com/mdn-data/-/mdn-data-2.0.6.tgz";
        sha1 = "852dc60fcaa5daa2e8cf6c9189c440ed3e042978";
      };
    }
    {
      name = "medium_zoom___medium_zoom_1.0.6.tgz";
      path = fetchurl {
        name = "medium_zoom___medium_zoom_1.0.6.tgz";
        url  = "https://registry.yarnpkg.com/medium-zoom/-/medium-zoom-1.0.6.tgz";
        sha1 = "9247f21ca9313d8bbe9420aca153a410df08d027";
      };
    }
    {
      name = "mem___mem_4.3.0.tgz";
      path = fetchurl {
        name = "mem___mem_4.3.0.tgz";
        url  = "https://registry.yarnpkg.com/mem/-/mem-4.3.0.tgz";
        sha1 = "461af497bc4ae09608cdb2e60eefb69bff744178";
      };
    }
    {
      name = "merge_source_map___merge_source_map_1.0.4.tgz";
      path = fetchurl {
        name = "merge_source_map___merge_source_map_1.0.4.tgz";
        url  = "https://registry.yarnpkg.com/merge-source-map/-/merge-source-map-1.0.4.tgz";
        sha1 = "a5de46538dae84d4114cc5ea02b4772a6346701f";
      };
    }
    {
      name = "merge_stream___merge_stream_2.0.0.tgz";
      path = fetchurl {
        name = "merge_stream___merge_stream_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/merge-stream/-/merge-stream-2.0.0.tgz";
        sha1 = "52823629a14dd00c9770fb6ad47dc6310f2c1f60";
      };
    }
    {
      name = "merge2___merge2_1.3.0.tgz";
      path = fetchurl {
        name = "merge2___merge2_1.3.0.tgz";
        url  = "https://registry.yarnpkg.com/merge2/-/merge2-1.3.0.tgz";
        sha1 = "5b366ee83b2f1582c48f87e47cf1a9352103ca81";
      };
    }
    {
      name = "micromatch___micromatch_3.1.10.tgz";
      path = fetchurl {
        name = "micromatch___micromatch_3.1.10.tgz";
        url  = "https://registry.yarnpkg.com/micromatch/-/micromatch-3.1.10.tgz";
        sha1 = "70859bc95c9840952f359a068a3fc49f9ecfac23";
      };
    }
    {
      name = "micromatch___micromatch_4.0.2.tgz";
      path = fetchurl {
        name = "micromatch___micromatch_4.0.2.tgz";
        url  = "https://registry.yarnpkg.com/micromatch/-/micromatch-4.0.2.tgz";
        sha1 = "4fcb0999bf9fbc2fcbdd212f6d629b9a56c39259";
      };
    }
    {
      name = "miller_rabin___miller_rabin_4.0.1.tgz";
      path = fetchurl {
        name = "miller_rabin___miller_rabin_4.0.1.tgz";
        url  = "https://registry.yarnpkg.com/miller-rabin/-/miller-rabin-4.0.1.tgz";
        sha1 = "f080351c865b0dc562a8462966daa53543c78a4d";
      };
    }
    {
      name = "mime_db___mime_db_1.44.0.tgz";
      path = fetchurl {
        name = "mime_db___mime_db_1.44.0.tgz";
        url  = "https://registry.yarnpkg.com/mime-db/-/mime-db-1.44.0.tgz";
        sha1 = "fa11c5eb0aca1334b4233cb4d52f10c5a6272f92";
      };
    }
    {
      name = "mime_types___mime_types_2.1.27.tgz";
      path = fetchurl {
        name = "mime_types___mime_types_2.1.27.tgz";
        url  = "https://registry.yarnpkg.com/mime-types/-/mime-types-2.1.27.tgz";
        sha1 = "47949f98e279ea53119f5722e0f34e529bec009f";
      };
    }
    {
      name = "mime___mime_1.6.0.tgz";
      path = fetchurl {
        name = "mime___mime_1.6.0.tgz";
        url  = "https://registry.yarnpkg.com/mime/-/mime-1.6.0.tgz";
        sha1 = "32cd9e5c64553bd58d19a568af452acff04981b1";
      };
    }
    {
      name = "mimic_fn___mimic_fn_1.2.0.tgz";
      path = fetchurl {
        name = "mimic_fn___mimic_fn_1.2.0.tgz";
        url  = "https://registry.yarnpkg.com/mimic-fn/-/mimic-fn-1.2.0.tgz";
        sha1 = "820c86a39334640e99516928bd03fca88057d022";
      };
    }
    {
      name = "mimic_fn___mimic_fn_2.1.0.tgz";
      path = fetchurl {
        name = "mimic_fn___mimic_fn_2.1.0.tgz";
        url  = "https://registry.yarnpkg.com/mimic-fn/-/mimic-fn-2.1.0.tgz";
        sha1 = "7ed2c2ccccaf84d3ffcb7a69b57711fc2083401b";
      };
    }
    {
      name = "min_indent___min_indent_1.0.1.tgz";
      path = fetchurl {
        name = "min_indent___min_indent_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/min-indent/-/min-indent-1.0.1.tgz";
        sha1 = "a63f681673b30571fbe8bc25686ae746eefa9869";
      };
    }
    {
      name = "mini_store___mini_store_2.0.0.tgz";
      path = fetchurl {
        name = "mini_store___mini_store_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/mini-store/-/mini-store-2.0.0.tgz";
        sha1 = "0843c048d6942ce55e3e78b1b67fc063022b5488";
      };
    }
    {
      name = "mini_store___mini_store_3.0.2.tgz";
      path = fetchurl {
        name = "mini_store___mini_store_3.0.2.tgz";
        url  = "https://registry.yarnpkg.com/mini-store/-/mini-store-3.0.2.tgz";
        sha1 = "d63991fce1e3c96287d92fc812ee67d090e49098";
      };
    }
    {
      name = "minimalistic_assert___minimalistic_assert_1.0.1.tgz";
      path = fetchurl {
        name = "minimalistic_assert___minimalistic_assert_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/minimalistic-assert/-/minimalistic-assert-1.0.1.tgz";
        sha1 = "2e194de044626d4a10e7f7fbc00ce73e83e4d5c7";
      };
    }
    {
      name = "minimalistic_crypto_utils___minimalistic_crypto_utils_1.0.1.tgz";
      path = fetchurl {
        name = "minimalistic_crypto_utils___minimalistic_crypto_utils_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/minimalistic-crypto-utils/-/minimalistic-crypto-utils-1.0.1.tgz";
        sha1 = "f6c00c1c0b082246e5c4d99dfb8c7c083b2b582a";
      };
    }
    {
      name = "minimatch___minimatch_3.0.4.tgz";
      path = fetchurl {
        name = "minimatch___minimatch_3.0.4.tgz";
        url  = "https://registry.yarnpkg.com/minimatch/-/minimatch-3.0.4.tgz";
        sha1 = "5166e286457f03306064be5497e8dbb0c3d32083";
      };
    }
    {
      name = "minimist___minimist_1.2.5.tgz";
      path = fetchurl {
        name = "minimist___minimist_1.2.5.tgz";
        url  = "https://registry.yarnpkg.com/minimist/-/minimist-1.2.5.tgz";
        sha1 = "67d66014b66a6a8aaa0c083c5fd58df4e4e97602";
      };
    }
    {
      name = "mixin_deep___mixin_deep_1.3.2.tgz";
      path = fetchurl {
        name = "mixin_deep___mixin_deep_1.3.2.tgz";
        url  = "https://registry.yarnpkg.com/mixin-deep/-/mixin-deep-1.3.2.tgz";
        sha1 = "1120b43dc359a785dce65b55b82e257ccf479566";
      };
    }
    {
      name = "mkdirp___mkdirp_0.5.5.tgz";
      path = fetchurl {
        name = "mkdirp___mkdirp_0.5.5.tgz";
        url  = "https://registry.yarnpkg.com/mkdirp/-/mkdirp-0.5.5.tgz";
        sha1 = "d91cefd62d1436ca0f41620e251288d420099def";
      };
    }
    {
      name = "mkdirp___mkdirp_1.0.4.tgz";
      path = fetchurl {
        name = "mkdirp___mkdirp_1.0.4.tgz";
        url  = "https://registry.yarnpkg.com/mkdirp/-/mkdirp-1.0.4.tgz";
        sha1 = "3eb5ed62622756d79a5f0e2a221dfebad75c2f7e";
      };
    }
    {
      name = "moduleserve___moduleserve_0.9.1.tgz";
      path = fetchurl {
        name = "moduleserve___moduleserve_0.9.1.tgz";
        url  = "https://registry.yarnpkg.com/moduleserve/-/moduleserve-0.9.1.tgz";
        sha1 = "11bad4337ea248d7eaf10d2c7f8649a8c3b9c1f8";
      };
    }
    {
      name = "moment___moment_2.24.0.tgz";
      path = fetchurl {
        name = "moment___moment_2.24.0.tgz";
        url  = "https://registry.yarnpkg.com/moment/-/moment-2.24.0.tgz";
        sha1 = "0d055d53f5052aa653c9f6eb68bb5d12bf5c2b5b";
      };
    }
    {
      name = "ms___ms_2.0.0.tgz";
      path = fetchurl {
        name = "ms___ms_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/ms/-/ms-2.0.0.tgz";
        sha1 = "5608aeadfc00be6c2901df5f9861788de0d597c8";
      };
    }
    {
      name = "ms___ms_2.1.1.tgz";
      path = fetchurl {
        name = "ms___ms_2.1.1.tgz";
        url  = "https://registry.yarnpkg.com/ms/-/ms-2.1.1.tgz";
        sha1 = "30a5864eb3ebb0a66f2ebe6d727af06a09d86e0a";
      };
    }
    {
      name = "ms___ms_2.1.2.tgz";
      path = fetchurl {
        name = "ms___ms_2.1.2.tgz";
        url  = "https://registry.yarnpkg.com/ms/-/ms-2.1.2.tgz";
        sha1 = "d09d1f357b443f493382a8eb3ccd183872ae6009";
      };
    }
    {
      name = "mutationobserver_shim___mutationobserver_shim_0.3.5.tgz";
      path = fetchurl {
        name = "mutationobserver_shim___mutationobserver_shim_0.3.5.tgz";
        url  = "https://registry.yarnpkg.com/mutationobserver-shim/-/mutationobserver-shim-0.3.5.tgz";
        sha1 = "6f35ce85867b21aa1e58f78892d0ab4eee942c0e";
      };
    }
    {
      name = "nan___nan_2.14.1.tgz";
      path = fetchurl {
        name = "nan___nan_2.14.1.tgz";
        url  = "https://registry.yarnpkg.com/nan/-/nan-2.14.1.tgz";
        sha1 = "d7be34dfa3105b91494c3147089315eff8874b01";
      };
    }
    {
      name = "nano_css___nano_css_5.3.0.tgz";
      path = fetchurl {
        name = "nano_css___nano_css_5.3.0.tgz";
        url  = "https://registry.yarnpkg.com/nano-css/-/nano-css-5.3.0.tgz";
        sha1 = "9d3cd29788d48b6a07f52aa4aec7cf4da427b6b5";
      };
    }
    {
      name = "nanomatch___nanomatch_1.2.13.tgz";
      path = fetchurl {
        name = "nanomatch___nanomatch_1.2.13.tgz";
        url  = "https://registry.yarnpkg.com/nanomatch/-/nanomatch-1.2.13.tgz";
        sha1 = "b87a8aa4fc0de8fe6be88895b38983ff265bd119";
      };
    }
    {
      name = "natural_compare___natural_compare_1.4.0.tgz";
      path = fetchurl {
        name = "natural_compare___natural_compare_1.4.0.tgz";
        url  = "https://registry.yarnpkg.com/natural-compare/-/natural-compare-1.4.0.tgz";
        sha1 = "4abebfeed7541f2c27acfb29bdbbd15c8d5ba4f7";
      };
    }
    {
      name = "nice_try___nice_try_1.0.5.tgz";
      path = fetchurl {
        name = "nice_try___nice_try_1.0.5.tgz";
        url  = "https://registry.yarnpkg.com/nice-try/-/nice-try-1.0.5.tgz";
        sha1 = "a3378a7696ce7d223e88fc9b764bd7ef1089e366";
      };
    }
    {
      name = "no_case___no_case_2.3.2.tgz";
      path = fetchurl {
        name = "no_case___no_case_2.3.2.tgz";
        url  = "https://registry.yarnpkg.com/no-case/-/no-case-2.3.2.tgz";
        sha1 = "60b813396be39b3f1288a4c1ed5d1e7d28b464ac";
      };
    }
    {
      name = "node_addon_api___node_addon_api_1.7.1.tgz";
      path = fetchurl {
        name = "node_addon_api___node_addon_api_1.7.1.tgz";
        url  = "https://registry.yarnpkg.com/node-addon-api/-/node-addon-api-1.7.1.tgz";
        sha1 = "cf813cd69bb8d9100f6bdca6755fc268f54ac492";
      };
    }
    {
      name = "node_emoji___node_emoji_1.10.0.tgz";
      path = fetchurl {
        name = "node_emoji___node_emoji_1.10.0.tgz";
        url  = "https://registry.yarnpkg.com/node-emoji/-/node-emoji-1.10.0.tgz";
        sha1 = "8886abd25d9c7bb61802a658523d1f8d2a89b2da";
      };
    }
    {
      name = "node_fetch___node_fetch_1.7.3.tgz";
      path = fetchurl {
        name = "node_fetch___node_fetch_1.7.3.tgz";
        url  = "https://registry.yarnpkg.com/node-fetch/-/node-fetch-1.7.3.tgz";
        sha1 = "980f6f72d85211a5347c6b2bc18c5b84c3eb47ef";
      };
    }
    {
      name = "node_fetch___node_fetch_2.6.0.tgz";
      path = fetchurl {
        name = "node_fetch___node_fetch_2.6.0.tgz";
        url  = "https://registry.yarnpkg.com/node-fetch/-/node-fetch-2.6.0.tgz";
        sha1 = "e633456386d4aa55863f676a7ab0daa8fdecb0fd";
      };
    }
    {
      name = "node_fetch___node_fetch_2.6.1.tgz";
      path = fetchurl {
        name = "node_fetch___node_fetch_2.6.1.tgz";
        url  = "https://registry.yarnpkg.com/node-fetch/-/node-fetch-2.6.1.tgz";
        sha1 = "045bd323631f76ed2e2b55573394416b639a0052";
      };
    }
    {
      name = "node_forge___node_forge_0.7.6.tgz";
      path = fetchurl {
        name = "node_forge___node_forge_0.7.6.tgz";
        url  = "https://registry.yarnpkg.com/node-forge/-/node-forge-0.7.6.tgz";
        sha1 = "fdf3b418aee1f94f0ef642cd63486c77ca9724ac";
      };
    }
    {
      name = "node_int64___node_int64_0.4.0.tgz";
      path = fetchurl {
        name = "node_int64___node_int64_0.4.0.tgz";
        url  = "https://registry.yarnpkg.com/node-int64/-/node-int64-0.4.0.tgz";
        sha1 = "87a9065cdb355d3182d8f94ce11188b825c68a3b";
      };
    }
    {
      name = "node_libs_browser___node_libs_browser_2.2.1.tgz";
      path = fetchurl {
        name = "node_libs_browser___node_libs_browser_2.2.1.tgz";
        url  = "https://registry.yarnpkg.com/node-libs-browser/-/node-libs-browser-2.2.1.tgz";
        sha1 = "b64f513d18338625f90346d27b0d235e631f6425";
      };
    }
    {
      name = "node_modules_regexp___node_modules_regexp_1.0.0.tgz";
      path = fetchurl {
        name = "node_modules_regexp___node_modules_regexp_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/node-modules-regexp/-/node-modules-regexp-1.0.0.tgz";
        sha1 = "8d9dbe28964a4ac5712e9131642107c71e90ec40";
      };
    }
    {
      name = "node_notifier___node_notifier_6.0.0.tgz";
      path = fetchurl {
        name = "node_notifier___node_notifier_6.0.0.tgz";
        url  = "https://registry.yarnpkg.com/node-notifier/-/node-notifier-6.0.0.tgz";
        sha1 = "cea319e06baa16deec8ce5cd7f133c4a46b68e12";
      };
    }
    {
      name = "node_releases___node_releases_1.1.53.tgz";
      path = fetchurl {
        name = "node_releases___node_releases_1.1.53.tgz";
        url  = "https://registry.yarnpkg.com/node-releases/-/node-releases-1.1.53.tgz";
        sha1 = "2d821bfa499ed7c5dffc5e2f28c88e78a08ee3f4";
      };
    }
    {
      name = "nopt___nopt_4.0.3.tgz";
      path = fetchurl {
        name = "nopt___nopt_4.0.3.tgz";
        url  = "https://registry.yarnpkg.com/nopt/-/nopt-4.0.3.tgz";
        sha1 = "a375cad9d02fd921278d954c2254d5aa57e15e48";
      };
    }
    {
      name = "normalize_html_whitespace___normalize_html_whitespace_1.0.0.tgz";
      path = fetchurl {
        name = "normalize_html_whitespace___normalize_html_whitespace_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/normalize-html-whitespace/-/normalize-html-whitespace-1.0.0.tgz";
        sha1 = "5e3c8e192f1b06c3b9eee4b7e7f28854c7601e34";
      };
    }
    {
      name = "normalize_package_data___normalize_package_data_2.5.0.tgz";
      path = fetchurl {
        name = "normalize_package_data___normalize_package_data_2.5.0.tgz";
        url  = "https://registry.yarnpkg.com/normalize-package-data/-/normalize-package-data-2.5.0.tgz";
        sha1 = "e66db1838b200c1dfc233225d12cb36520e234a8";
      };
    }
    {
      name = "normalize_path___normalize_path_2.1.1.tgz";
      path = fetchurl {
        name = "normalize_path___normalize_path_2.1.1.tgz";
        url  = "https://registry.yarnpkg.com/normalize-path/-/normalize-path-2.1.1.tgz";
        sha1 = "1ab28b556e198363a8c1a6f7e6fa20137fe6aed9";
      };
    }
    {
      name = "normalize_path___normalize_path_3.0.0.tgz";
      path = fetchurl {
        name = "normalize_path___normalize_path_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/normalize-path/-/normalize-path-3.0.0.tgz";
        sha1 = "0dcd69ff23a1c9b11fd0978316644a0388216a65";
      };
    }
    {
      name = "normalize_range___normalize_range_0.1.2.tgz";
      path = fetchurl {
        name = "normalize_range___normalize_range_0.1.2.tgz";
        url  = "https://registry.yarnpkg.com/normalize-range/-/normalize-range-0.1.2.tgz";
        sha1 = "2d10c06bdfd312ea9777695a4d28439456b75942";
      };
    }
    {
      name = "normalize_url___normalize_url_1.9.1.tgz";
      path = fetchurl {
        name = "normalize_url___normalize_url_1.9.1.tgz";
        url  = "https://registry.yarnpkg.com/normalize-url/-/normalize-url-1.9.1.tgz";
        sha1 = "2cc0d66b31ea23036458436e3620d85954c66c3c";
      };
    }
    {
      name = "normalize_url___normalize_url_3.3.0.tgz";
      path = fetchurl {
        name = "normalize_url___normalize_url_3.3.0.tgz";
        url  = "https://registry.yarnpkg.com/normalize-url/-/normalize-url-3.3.0.tgz";
        sha1 = "b2e1c4dc4f7c6d57743df733a4f5978d18650559";
      };
    }
    {
      name = "normalize.css___normalize.css_8.0.1.tgz";
      path = fetchurl {
        name = "normalize.css___normalize.css_8.0.1.tgz";
        url  = "https://registry.yarnpkg.com/normalize.css/-/normalize.css-8.0.1.tgz";
        sha1 = "9b98a208738b9cc2634caacbc42d131c97487bf3";
      };
    }
    {
      name = "npm_run_path___npm_run_path_2.0.2.tgz";
      path = fetchurl {
        name = "npm_run_path___npm_run_path_2.0.2.tgz";
        url  = "https://registry.yarnpkg.com/npm-run-path/-/npm-run-path-2.0.2.tgz";
        sha1 = "35a9232dfa35d7067b4cb2ddf2357b1871536c5f";
      };
    }
    {
      name = "npm_run_path___npm_run_path_4.0.1.tgz";
      path = fetchurl {
        name = "npm_run_path___npm_run_path_4.0.1.tgz";
        url  = "https://registry.yarnpkg.com/npm-run-path/-/npm-run-path-4.0.1.tgz";
        sha1 = "b7ecd1e5ed53da8e37a55e1c2269e0b97ed748ea";
      };
    }
    {
      name = "nth_check___nth_check_1.0.2.tgz";
      path = fetchurl {
        name = "nth_check___nth_check_1.0.2.tgz";
        url  = "https://registry.yarnpkg.com/nth-check/-/nth-check-1.0.2.tgz";
        sha1 = "b2bd295c37e3dd58a3bf0700376663ba4d9cf05c";
      };
    }
    {
      name = "num2fraction___num2fraction_1.2.2.tgz";
      path = fetchurl {
        name = "num2fraction___num2fraction_1.2.2.tgz";
        url  = "https://registry.yarnpkg.com/num2fraction/-/num2fraction-1.2.2.tgz";
        sha1 = "6f682b6a027a4e9ddfa4564cd2589d1d4e669ede";
      };
    }
    {
      name = "number_is_nan___number_is_nan_1.0.1.tgz";
      path = fetchurl {
        name = "number_is_nan___number_is_nan_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/number-is-nan/-/number-is-nan-1.0.1.tgz";
        sha1 = "097b602b53422a522c1afb8790318336941a011d";
      };
    }
    {
      name = "nwsapi___nwsapi_2.2.0.tgz";
      path = fetchurl {
        name = "nwsapi___nwsapi_2.2.0.tgz";
        url  = "https://registry.yarnpkg.com/nwsapi/-/nwsapi-2.2.0.tgz";
        sha1 = "204879a9e3d068ff2a55139c2c772780681a38b7";
      };
    }
    {
      name = "oauth_sign___oauth_sign_0.9.0.tgz";
      path = fetchurl {
        name = "oauth_sign___oauth_sign_0.9.0.tgz";
        url  = "https://registry.yarnpkg.com/oauth-sign/-/oauth-sign-0.9.0.tgz";
        sha1 = "47a7b016baa68b5fa0ecf3dee08a85c679ac6455";
      };
    }
    {
      name = "object_assign___object_assign_4.1.1.tgz";
      path = fetchurl {
        name = "object_assign___object_assign_4.1.1.tgz";
        url  = "https://registry.yarnpkg.com/object-assign/-/object-assign-4.1.1.tgz";
        sha1 = "2109adc7965887cfc05cbbd442cac8bfbb360863";
      };
    }
    {
      name = "object_copy___object_copy_0.1.0.tgz";
      path = fetchurl {
        name = "object_copy___object_copy_0.1.0.tgz";
        url  = "https://registry.yarnpkg.com/object-copy/-/object-copy-0.1.0.tgz";
        sha1 = "7e7d858b781bd7c991a41ba975ed3812754e998c";
      };
    }
    {
      name = "object_inspect___object_inspect_1.7.0.tgz";
      path = fetchurl {
        name = "object_inspect___object_inspect_1.7.0.tgz";
        url  = "https://registry.yarnpkg.com/object-inspect/-/object-inspect-1.7.0.tgz";
        sha1 = "f4f6bd181ad77f006b5ece60bd0b6f398ff74a67";
      };
    }
    {
      name = "object_inspect___object_inspect_1.4.1.tgz";
      path = fetchurl {
        name = "object_inspect___object_inspect_1.4.1.tgz";
        url  = "https://registry.yarnpkg.com/object-inspect/-/object-inspect-1.4.1.tgz";
        sha1 = "37ffb10e71adaf3748d05f713b4c9452f402cbc4";
      };
    }
    {
      name = "object_keys___object_keys_1.1.1.tgz";
      path = fetchurl {
        name = "object_keys___object_keys_1.1.1.tgz";
        url  = "https://registry.yarnpkg.com/object-keys/-/object-keys-1.1.1.tgz";
        sha1 = "1c47f272df277f3b1daf061677d9c82e2322c60e";
      };
    }
    {
      name = "object_visit___object_visit_1.0.1.tgz";
      path = fetchurl {
        name = "object_visit___object_visit_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/object-visit/-/object-visit-1.0.1.tgz";
        sha1 = "f79c4493af0c5377b59fe39d395e41042dd045bb";
      };
    }
    {
      name = "object.assign___object.assign_4.1.0.tgz";
      path = fetchurl {
        name = "object.assign___object.assign_4.1.0.tgz";
        url  = "https://registry.yarnpkg.com/object.assign/-/object.assign-4.1.0.tgz";
        sha1 = "968bf1100d7956bb3ca086f006f846b3bc4008da";
      };
    }
    {
      name = "object.getownpropertydescriptors___object.getownpropertydescriptors_2.1.0.tgz";
      path = fetchurl {
        name = "object.getownpropertydescriptors___object.getownpropertydescriptors_2.1.0.tgz";
        url  = "https://registry.yarnpkg.com/object.getownpropertydescriptors/-/object.getownpropertydescriptors-2.1.0.tgz";
        sha1 = "369bf1f9592d8ab89d712dced5cb81c7c5352649";
      };
    }
    {
      name = "object.pick___object.pick_1.3.0.tgz";
      path = fetchurl {
        name = "object.pick___object.pick_1.3.0.tgz";
        url  = "https://registry.yarnpkg.com/object.pick/-/object.pick-1.3.0.tgz";
        sha1 = "87a10ac4c1694bd2e1cbf53591a66141fb5dd747";
      };
    }
    {
      name = "object.values___object.values_1.1.1.tgz";
      path = fetchurl {
        name = "object.values___object.values_1.1.1.tgz";
        url  = "https://registry.yarnpkg.com/object.values/-/object.values-1.1.1.tgz";
        sha1 = "68a99ecde356b7e9295a3c5e0ce31dc8c953de5e";
      };
    }
    {
      name = "omit.js___omit.js_1.0.2.tgz";
      path = fetchurl {
        name = "omit.js___omit.js_1.0.2.tgz";
        url  = "https://registry.yarnpkg.com/omit.js/-/omit.js-1.0.2.tgz";
        sha1 = "91a14f0eba84066dfa015bf30e474c47f30bc858";
      };
    }
    {
      name = "on_finished___on_finished_2.3.0.tgz";
      path = fetchurl {
        name = "on_finished___on_finished_2.3.0.tgz";
        url  = "https://registry.yarnpkg.com/on-finished/-/on-finished-2.3.0.tgz";
        sha1 = "20f1336481b083cd75337992a16971aa2d906947";
      };
    }
    {
      name = "once___once_1.4.0.tgz";
      path = fetchurl {
        name = "once___once_1.4.0.tgz";
        url  = "https://registry.yarnpkg.com/once/-/once-1.4.0.tgz";
        sha1 = "583b1aa775961d4b113ac17d9c50baef9dd76bd1";
      };
    }
    {
      name = "onetime___onetime_2.0.1.tgz";
      path = fetchurl {
        name = "onetime___onetime_2.0.1.tgz";
        url  = "https://registry.yarnpkg.com/onetime/-/onetime-2.0.1.tgz";
        sha1 = "067428230fd67443b2794b22bba528b6867962d4";
      };
    }
    {
      name = "onetime___onetime_5.1.0.tgz";
      path = fetchurl {
        name = "onetime___onetime_5.1.0.tgz";
        url  = "https://registry.yarnpkg.com/onetime/-/onetime-5.1.0.tgz";
        sha1 = "fff0f3c91617fe62bb50189636e99ac8a6df7be5";
      };
    }
    {
      name = "opencollective_postinstall___opencollective_postinstall_2.0.3.tgz";
      path = fetchurl {
        name = "opencollective_postinstall___opencollective_postinstall_2.0.3.tgz";
        url  = "https://registry.yarnpkg.com/opencollective-postinstall/-/opencollective-postinstall-2.0.3.tgz";
        sha1 = "7a0fff978f6dbfa4d006238fbac98ed4198c3259";
      };
    }
    {
      name = "opn___opn_5.5.0.tgz";
      path = fetchurl {
        name = "opn___opn_5.5.0.tgz";
        url  = "https://registry.yarnpkg.com/opn/-/opn-5.5.0.tgz";
        sha1 = "fc7164fab56d235904c51c3b27da6758ca3b9bfc";
      };
    }
    {
      name = "optimism___optimism_0.10.3.tgz";
      path = fetchurl {
        name = "optimism___optimism_0.10.3.tgz";
        url  = "https://registry.yarnpkg.com/optimism/-/optimism-0.10.3.tgz";
        sha1 = "163268fdc741dea2fb50f300bedda80356445fd7";
      };
    }
    {
      name = "optionator___optionator_0.8.3.tgz";
      path = fetchurl {
        name = "optionator___optionator_0.8.3.tgz";
        url  = "https://registry.yarnpkg.com/optionator/-/optionator-0.8.3.tgz";
        sha1 = "84fa1d036fe9d3c7e21d99884b601167ec8fb495";
      };
    }
    {
      name = "ora___ora_2.1.0.tgz";
      path = fetchurl {
        name = "ora___ora_2.1.0.tgz";
        url  = "https://registry.yarnpkg.com/ora/-/ora-2.1.0.tgz";
        sha1 = "6caf2830eb924941861ec53a173799e008b51e5b";
      };
    }
    {
      name = "os_browserify___os_browserify_0.3.0.tgz";
      path = fetchurl {
        name = "os_browserify___os_browserify_0.3.0.tgz";
        url  = "https://registry.yarnpkg.com/os-browserify/-/os-browserify-0.3.0.tgz";
        sha1 = "854373c7f5c2315914fc9bfc6bd8238fdda1ec27";
      };
    }
    {
      name = "os_homedir___os_homedir_1.0.2.tgz";
      path = fetchurl {
        name = "os_homedir___os_homedir_1.0.2.tgz";
        url  = "https://registry.yarnpkg.com/os-homedir/-/os-homedir-1.0.2.tgz";
        sha1 = "ffbc4988336e0e833de0c168c7ef152121aa7fb3";
      };
    }
    {
      name = "os_locale___os_locale_3.1.0.tgz";
      path = fetchurl {
        name = "os_locale___os_locale_3.1.0.tgz";
        url  = "https://registry.yarnpkg.com/os-locale/-/os-locale-3.1.0.tgz";
        sha1 = "a802a6ee17f24c10483ab9935719cef4ed16bf1a";
      };
    }
    {
      name = "os_tmpdir___os_tmpdir_1.0.2.tgz";
      path = fetchurl {
        name = "os_tmpdir___os_tmpdir_1.0.2.tgz";
        url  = "https://registry.yarnpkg.com/os-tmpdir/-/os-tmpdir-1.0.2.tgz";
        sha1 = "bbe67406c79aa85c5cfec766fe5734555dfa1274";
      };
    }
    {
      name = "osenv___osenv_0.1.5.tgz";
      path = fetchurl {
        name = "osenv___osenv_0.1.5.tgz";
        url  = "https://registry.yarnpkg.com/osenv/-/osenv-0.1.5.tgz";
        sha1 = "85cdfafaeb28e8677f416e287592b5f3f49ea410";
      };
    }
    {
      name = "p_defer___p_defer_1.0.0.tgz";
      path = fetchurl {
        name = "p_defer___p_defer_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/p-defer/-/p-defer-1.0.0.tgz";
        sha1 = "9f6eb182f6c9aa8cd743004a7d4f96b196b0fb0c";
      };
    }
    {
      name = "p_each_series___p_each_series_2.1.0.tgz";
      path = fetchurl {
        name = "p_each_series___p_each_series_2.1.0.tgz";
        url  = "https://registry.yarnpkg.com/p-each-series/-/p-each-series-2.1.0.tgz";
        sha1 = "961c8dd3f195ea96c747e636b262b800a6b1af48";
      };
    }
    {
      name = "p_finally___p_finally_1.0.0.tgz";
      path = fetchurl {
        name = "p_finally___p_finally_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/p-finally/-/p-finally-1.0.0.tgz";
        sha1 = "3fbcfb15b899a44123b34b6dcc18b724336a2cae";
      };
    }
    {
      name = "p_finally___p_finally_2.0.1.tgz";
      path = fetchurl {
        name = "p_finally___p_finally_2.0.1.tgz";
        url  = "https://registry.yarnpkg.com/p-finally/-/p-finally-2.0.1.tgz";
        sha1 = "bd6fcaa9c559a096b680806f4d657b3f0f240561";
      };
    }
    {
      name = "p_is_promise___p_is_promise_2.1.0.tgz";
      path = fetchurl {
        name = "p_is_promise___p_is_promise_2.1.0.tgz";
        url  = "https://registry.yarnpkg.com/p-is-promise/-/p-is-promise-2.1.0.tgz";
        sha1 = "918cebaea248a62cf7ffab8e3bca8c5f882fc42e";
      };
    }
    {
      name = "p_limit___p_limit_1.3.0.tgz";
      path = fetchurl {
        name = "p_limit___p_limit_1.3.0.tgz";
        url  = "https://registry.yarnpkg.com/p-limit/-/p-limit-1.3.0.tgz";
        sha1 = "b86bd5f0c25690911c7590fcbfc2010d54b3ccb8";
      };
    }
    {
      name = "p_limit___p_limit_2.3.0.tgz";
      path = fetchurl {
        name = "p_limit___p_limit_2.3.0.tgz";
        url  = "https://registry.yarnpkg.com/p-limit/-/p-limit-2.3.0.tgz";
        sha1 = "3dd33c647a214fdfffd835933eb086da0dc21db1";
      };
    }
    {
      name = "p_locate___p_locate_2.0.0.tgz";
      path = fetchurl {
        name = "p_locate___p_locate_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/p-locate/-/p-locate-2.0.0.tgz";
        sha1 = "20a0103b222a70c8fd39cc2e580680f3dde5ec43";
      };
    }
    {
      name = "p_locate___p_locate_3.0.0.tgz";
      path = fetchurl {
        name = "p_locate___p_locate_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/p-locate/-/p-locate-3.0.0.tgz";
        sha1 = "322d69a05c0264b25997d9f40cd8a891ab0064a4";
      };
    }
    {
      name = "p_locate___p_locate_4.1.0.tgz";
      path = fetchurl {
        name = "p_locate___p_locate_4.1.0.tgz";
        url  = "https://registry.yarnpkg.com/p-locate/-/p-locate-4.1.0.tgz";
        sha1 = "a3428bb7088b3a60292f66919278b7c297ad4f07";
      };
    }
    {
      name = "p_try___p_try_1.0.0.tgz";
      path = fetchurl {
        name = "p_try___p_try_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/p-try/-/p-try-1.0.0.tgz";
        sha1 = "cbc79cdbaf8fd4228e13f621f2b1a237c1b207b3";
      };
    }
    {
      name = "p_try___p_try_2.2.0.tgz";
      path = fetchurl {
        name = "p_try___p_try_2.2.0.tgz";
        url  = "https://registry.yarnpkg.com/p-try/-/p-try-2.2.0.tgz";
        sha1 = "cb2868540e313d61de58fafbe35ce9004d5540e6";
      };
    }
    {
      name = "pako___pako_0.2.9.tgz";
      path = fetchurl {
        name = "pako___pako_0.2.9.tgz";
        url  = "https://registry.yarnpkg.com/pako/-/pako-0.2.9.tgz";
        sha1 = "f3f7522f4ef782348da8161bad9ecfd51bf83a75";
      };
    }
    {
      name = "pako___pako_1.0.11.tgz";
      path = fetchurl {
        name = "pako___pako_1.0.11.tgz";
        url  = "https://registry.yarnpkg.com/pako/-/pako-1.0.11.tgz";
        sha1 = "6c9599d340d54dfd3946380252a35705a6b992bf";
      };
    }
    {
      name = "parcel_bundler___parcel_bundler_1.12.4.tgz";
      path = fetchurl {
        name = "parcel_bundler___parcel_bundler_1.12.4.tgz";
        url  = "https://registry.yarnpkg.com/parcel-bundler/-/parcel-bundler-1.12.4.tgz";
        sha1 = "31223f4ab4d00323a109fce28d5e46775409a9ee";
      };
    }
    {
      name = "parcel_plugin_bundle_visualiser___parcel_plugin_bundle_visualiser_1.2.0.tgz";
      path = fetchurl {
        name = "parcel_plugin_bundle_visualiser___parcel_plugin_bundle_visualiser_1.2.0.tgz";
        url  = "https://registry.yarnpkg.com/parcel-plugin-bundle-visualiser/-/parcel-plugin-bundle-visualiser-1.2.0.tgz";
        sha1 = "b24cde64233c8e8ce2561ec5d864a7543d8e719d";
      };
    }
    {
      name = "parcel_plugin_less_js_enabled___parcel_plugin_less_js_enabled_1.0.2.tgz";
      path = fetchurl {
        name = "parcel_plugin_less_js_enabled___parcel_plugin_less_js_enabled_1.0.2.tgz";
        url  = "https://registry.yarnpkg.com/parcel-plugin-less-js-enabled/-/parcel-plugin-less-js-enabled-1.0.2.tgz";
        sha1 = "77d74166b406e6a516106653471b2fd619564af3";
      };
    }
    {
      name = "parcel___parcel_1.12.3.tgz";
      path = fetchurl {
        name = "parcel___parcel_1.12.3.tgz";
        url  = "https://registry.yarnpkg.com/parcel/-/parcel-1.12.3.tgz";
        sha1 = "1f1341589380f20be924f1dd67c7fed193b346ec";
      };
    }
    {
      name = "parent_module___parent_module_1.0.1.tgz";
      path = fetchurl {
        name = "parent_module___parent_module_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/parent-module/-/parent-module-1.0.1.tgz";
        sha1 = "691d2709e78c79fae3a156622452d00762caaaa2";
      };
    }
    {
      name = "parse_asn1___parse_asn1_5.1.5.tgz";
      path = fetchurl {
        name = "parse_asn1___parse_asn1_5.1.5.tgz";
        url  = "https://registry.yarnpkg.com/parse-asn1/-/parse-asn1-5.1.5.tgz";
        sha1 = "003271343da58dc94cace494faef3d2147ecea0e";
      };
    }
    {
      name = "parse_json___parse_json_4.0.0.tgz";
      path = fetchurl {
        name = "parse_json___parse_json_4.0.0.tgz";
        url  = "https://registry.yarnpkg.com/parse-json/-/parse-json-4.0.0.tgz";
        sha1 = "be35f5425be1f7f6c747184f98a788cb99477ee0";
      };
    }
    {
      name = "parse_json___parse_json_5.0.0.tgz";
      path = fetchurl {
        name = "parse_json___parse_json_5.0.0.tgz";
        url  = "https://registry.yarnpkg.com/parse-json/-/parse-json-5.0.0.tgz";
        sha1 = "73e5114c986d143efa3712d4ea24db9a4266f60f";
      };
    }
    {
      name = "parse5___parse5_5.1.0.tgz";
      path = fetchurl {
        name = "parse5___parse5_5.1.0.tgz";
        url  = "https://registry.yarnpkg.com/parse5/-/parse5-5.1.0.tgz";
        sha1 = "c59341c9723f414c452975564c7c00a68d58acd2";
      };
    }
    {
      name = "parseurl___parseurl_1.3.3.tgz";
      path = fetchurl {
        name = "parseurl___parseurl_1.3.3.tgz";
        url  = "https://registry.yarnpkg.com/parseurl/-/parseurl-1.3.3.tgz";
        sha1 = "9da19e7bee8d12dff0513ed5b76957793bc2e8d4";
      };
    }
    {
      name = "pascalcase___pascalcase_0.1.1.tgz";
      path = fetchurl {
        name = "pascalcase___pascalcase_0.1.1.tgz";
        url  = "https://registry.yarnpkg.com/pascalcase/-/pascalcase-0.1.1.tgz";
        sha1 = "b363e55e8006ca6fe21784d2db22bd15d7917f14";
      };
    }
    {
      name = "path_browserify___path_browserify_0.0.1.tgz";
      path = fetchurl {
        name = "path_browserify___path_browserify_0.0.1.tgz";
        url  = "https://registry.yarnpkg.com/path-browserify/-/path-browserify-0.0.1.tgz";
        sha1 = "e6c4ddd7ed3aa27c68a20cc4e50e1a4ee83bbc4a";
      };
    }
    {
      name = "path_dirname___path_dirname_1.0.2.tgz";
      path = fetchurl {
        name = "path_dirname___path_dirname_1.0.2.tgz";
        url  = "https://registry.yarnpkg.com/path-dirname/-/path-dirname-1.0.2.tgz";
        sha1 = "cc33d24d525e099a5388c0336c6e32b9160609e0";
      };
    }
    {
      name = "path_exists___path_exists_3.0.0.tgz";
      path = fetchurl {
        name = "path_exists___path_exists_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/path-exists/-/path-exists-3.0.0.tgz";
        sha1 = "ce0ebeaa5f78cb18925ea7d810d7b59b010fd515";
      };
    }
    {
      name = "path_exists___path_exists_4.0.0.tgz";
      path = fetchurl {
        name = "path_exists___path_exists_4.0.0.tgz";
        url  = "https://registry.yarnpkg.com/path-exists/-/path-exists-4.0.0.tgz";
        sha1 = "513bdbe2d3b95d7762e8c1137efa195c6c61b5b3";
      };
    }
    {
      name = "path_is_absolute___path_is_absolute_1.0.1.tgz";
      path = fetchurl {
        name = "path_is_absolute___path_is_absolute_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/path-is-absolute/-/path-is-absolute-1.0.1.tgz";
        sha1 = "174b9268735534ffbc7ace6bf53a5a9e1b5c5f5f";
      };
    }
    {
      name = "path_key___path_key_2.0.1.tgz";
      path = fetchurl {
        name = "path_key___path_key_2.0.1.tgz";
        url  = "https://registry.yarnpkg.com/path-key/-/path-key-2.0.1.tgz";
        sha1 = "411cadb574c5a140d3a4b1910d40d80cc9f40b40";
      };
    }
    {
      name = "path_key___path_key_3.1.1.tgz";
      path = fetchurl {
        name = "path_key___path_key_3.1.1.tgz";
        url  = "https://registry.yarnpkg.com/path-key/-/path-key-3.1.1.tgz";
        sha1 = "581f6ade658cbba65a0d3380de7753295054f375";
      };
    }
    {
      name = "path_parse___path_parse_1.0.6.tgz";
      path = fetchurl {
        name = "path_parse___path_parse_1.0.6.tgz";
        url  = "https://registry.yarnpkg.com/path-parse/-/path-parse-1.0.6.tgz";
        sha1 = "d62dbb5679405d72c4737ec58600e9ddcf06d24c";
      };
    }
    {
      name = "path_type___path_type_4.0.0.tgz";
      path = fetchurl {
        name = "path_type___path_type_4.0.0.tgz";
        url  = "https://registry.yarnpkg.com/path-type/-/path-type-4.0.0.tgz";
        sha1 = "84ed01c0a7ba380afe09d90a8c180dcd9d03043b";
      };
    }
    {
      name = "pbkdf2___pbkdf2_3.0.17.tgz";
      path = fetchurl {
        name = "pbkdf2___pbkdf2_3.0.17.tgz";
        url  = "https://registry.yarnpkg.com/pbkdf2/-/pbkdf2-3.0.17.tgz";
        sha1 = "976c206530617b14ebb32114239f7b09336e93a6";
      };
    }
    {
      name = "pdfast___pdfast_0.2.0.tgz";
      path = fetchurl {
        name = "pdfast___pdfast_0.2.0.tgz";
        url  = "https://registry.yarnpkg.com/pdfast/-/pdfast-0.2.0.tgz";
        sha1 = "8cbc556e1bf2522177787c0de2e0d4373ba885c9";
      };
    }
    {
      name = "performance_now___performance_now_2.1.0.tgz";
      path = fetchurl {
        name = "performance_now___performance_now_2.1.0.tgz";
        url  = "https://registry.yarnpkg.com/performance-now/-/performance-now-2.1.0.tgz";
        sha1 = "6309f4e0e5fa913ec1c69307ae364b4b377c9e7b";
      };
    }
    {
      name = "physical_cpu_count___physical_cpu_count_2.0.0.tgz";
      path = fetchurl {
        name = "physical_cpu_count___physical_cpu_count_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/physical-cpu-count/-/physical-cpu-count-2.0.0.tgz";
        sha1 = "18de2f97e4bf7a9551ad7511942b5496f7aba660";
      };
    }
    {
      name = "picomatch___picomatch_2.2.2.tgz";
      path = fetchurl {
        name = "picomatch___picomatch_2.2.2.tgz";
        url  = "https://registry.yarnpkg.com/picomatch/-/picomatch-2.2.2.tgz";
        sha1 = "21f333e9b6b8eaff02468f5146ea406d345f4dad";
      };
    }
    {
      name = "pify___pify_2.3.0.tgz";
      path = fetchurl {
        name = "pify___pify_2.3.0.tgz";
        url  = "https://registry.yarnpkg.com/pify/-/pify-2.3.0.tgz";
        sha1 = "ed141a6ac043a849ea588498e7dca8b15330e90c";
      };
    }
    {
      name = "pify___pify_3.0.0.tgz";
      path = fetchurl {
        name = "pify___pify_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/pify/-/pify-3.0.0.tgz";
        sha1 = "e5a4acd2c101fdf3d9a4d07f0dbc4db49dd28176";
      };
    }
    {
      name = "pinkie_promise___pinkie_promise_2.0.1.tgz";
      path = fetchurl {
        name = "pinkie_promise___pinkie_promise_2.0.1.tgz";
        url  = "https://registry.yarnpkg.com/pinkie-promise/-/pinkie-promise-2.0.1.tgz";
        sha1 = "2135d6dfa7a358c069ac9b178776288228450ffa";
      };
    }
    {
      name = "pinkie___pinkie_2.0.4.tgz";
      path = fetchurl {
        name = "pinkie___pinkie_2.0.4.tgz";
        url  = "https://registry.yarnpkg.com/pinkie/-/pinkie-2.0.4.tgz";
        sha1 = "72556b80cfa0d48a974e80e77248e80ed4f7f870";
      };
    }
    {
      name = "pirates___pirates_4.0.1.tgz";
      path = fetchurl {
        name = "pirates___pirates_4.0.1.tgz";
        url  = "https://registry.yarnpkg.com/pirates/-/pirates-4.0.1.tgz";
        sha1 = "643a92caf894566f91b2b986d2c66950a8e2fb87";
      };
    }
    {
      name = "pkg_dir___pkg_dir_4.2.0.tgz";
      path = fetchurl {
        name = "pkg_dir___pkg_dir_4.2.0.tgz";
        url  = "https://registry.yarnpkg.com/pkg-dir/-/pkg-dir-4.2.0.tgz";
        sha1 = "f099133df7ede422e81d1d8448270eeb3e4261f3";
      };
    }
    {
      name = "pkg_up___pkg_up_2.0.0.tgz";
      path = fetchurl {
        name = "pkg_up___pkg_up_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/pkg-up/-/pkg-up-2.0.0.tgz";
        sha1 = "c819ac728059a461cab1c3889a2be3c49a004d7f";
      };
    }
    {
      name = "pn___pn_1.1.0.tgz";
      path = fetchurl {
        name = "pn___pn_1.1.0.tgz";
        url  = "https://registry.yarnpkg.com/pn/-/pn-1.1.0.tgz";
        sha1 = "e2f4cef0e219f463c179ab37463e4e1ecdccbafb";
      };
    }
    {
      name = "posix_character_classes___posix_character_classes_0.1.1.tgz";
      path = fetchurl {
        name = "posix_character_classes___posix_character_classes_0.1.1.tgz";
        url  = "https://registry.yarnpkg.com/posix-character-classes/-/posix-character-classes-0.1.1.tgz";
        sha1 = "01eac0fe3b5af71a2a6c02feabb8c1fef7e00eab";
      };
    }
    {
      name = "postcss_calc___postcss_calc_7.0.2.tgz";
      path = fetchurl {
        name = "postcss_calc___postcss_calc_7.0.2.tgz";
        url  = "https://registry.yarnpkg.com/postcss-calc/-/postcss-calc-7.0.2.tgz";
        sha1 = "504efcd008ca0273120568b0792b16cdcde8aac1";
      };
    }
    {
      name = "postcss_cli___postcss_cli_7.1.0.tgz";
      path = fetchurl {
        name = "postcss_cli___postcss_cli_7.1.0.tgz";
        url  = "https://registry.yarnpkg.com/postcss-cli/-/postcss-cli-7.1.0.tgz";
        sha1 = "769b07b8865aaa3e98c7c63a3d256b4f51e3e237";
      };
    }
    {
      name = "postcss_colormin___postcss_colormin_4.0.3.tgz";
      path = fetchurl {
        name = "postcss_colormin___postcss_colormin_4.0.3.tgz";
        url  = "https://registry.yarnpkg.com/postcss-colormin/-/postcss-colormin-4.0.3.tgz";
        sha1 = "ae060bce93ed794ac71264f08132d550956bd381";
      };
    }
    {
      name = "postcss_convert_values___postcss_convert_values_4.0.1.tgz";
      path = fetchurl {
        name = "postcss_convert_values___postcss_convert_values_4.0.1.tgz";
        url  = "https://registry.yarnpkg.com/postcss-convert-values/-/postcss-convert-values-4.0.1.tgz";
        sha1 = "ca3813ed4da0f812f9d43703584e449ebe189a7f";
      };
    }
    {
      name = "postcss_discard_comments___postcss_discard_comments_4.0.2.tgz";
      path = fetchurl {
        name = "postcss_discard_comments___postcss_discard_comments_4.0.2.tgz";
        url  = "https://registry.yarnpkg.com/postcss-discard-comments/-/postcss-discard-comments-4.0.2.tgz";
        sha1 = "1fbabd2c246bff6aaad7997b2b0918f4d7af4033";
      };
    }
    {
      name = "postcss_discard_duplicates___postcss_discard_duplicates_4.0.2.tgz";
      path = fetchurl {
        name = "postcss_discard_duplicates___postcss_discard_duplicates_4.0.2.tgz";
        url  = "https://registry.yarnpkg.com/postcss-discard-duplicates/-/postcss-discard-duplicates-4.0.2.tgz";
        sha1 = "3fe133cd3c82282e550fc9b239176a9207b784eb";
      };
    }
    {
      name = "postcss_discard_empty___postcss_discard_empty_4.0.1.tgz";
      path = fetchurl {
        name = "postcss_discard_empty___postcss_discard_empty_4.0.1.tgz";
        url  = "https://registry.yarnpkg.com/postcss-discard-empty/-/postcss-discard-empty-4.0.1.tgz";
        sha1 = "c8c951e9f73ed9428019458444a02ad90bb9f765";
      };
    }
    {
      name = "postcss_discard_overridden___postcss_discard_overridden_4.0.1.tgz";
      path = fetchurl {
        name = "postcss_discard_overridden___postcss_discard_overridden_4.0.1.tgz";
        url  = "https://registry.yarnpkg.com/postcss-discard-overridden/-/postcss-discard-overridden-4.0.1.tgz";
        sha1 = "652aef8a96726f029f5e3e00146ee7a4e755ff57";
      };
    }
    {
      name = "postcss_functions___postcss_functions_3.0.0.tgz";
      path = fetchurl {
        name = "postcss_functions___postcss_functions_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/postcss-functions/-/postcss-functions-3.0.0.tgz";
        sha1 = "0e94d01444700a481de20de4d55fb2640564250e";
      };
    }
    {
      name = "postcss_js___postcss_js_2.0.3.tgz";
      path = fetchurl {
        name = "postcss_js___postcss_js_2.0.3.tgz";
        url  = "https://registry.yarnpkg.com/postcss-js/-/postcss-js-2.0.3.tgz";
        sha1 = "a96f0f23ff3d08cec7dc5b11bf11c5f8077cdab9";
      };
    }
    {
      name = "postcss_load_config___postcss_load_config_2.1.0.tgz";
      path = fetchurl {
        name = "postcss_load_config___postcss_load_config_2.1.0.tgz";
        url  = "https://registry.yarnpkg.com/postcss-load-config/-/postcss-load-config-2.1.0.tgz";
        sha1 = "c84d692b7bb7b41ddced94ee62e8ab31b417b003";
      };
    }
    {
      name = "postcss_merge_longhand___postcss_merge_longhand_4.0.11.tgz";
      path = fetchurl {
        name = "postcss_merge_longhand___postcss_merge_longhand_4.0.11.tgz";
        url  = "https://registry.yarnpkg.com/postcss-merge-longhand/-/postcss-merge-longhand-4.0.11.tgz";
        sha1 = "62f49a13e4a0ee04e7b98f42bb16062ca2549e24";
      };
    }
    {
      name = "postcss_merge_rules___postcss_merge_rules_4.0.3.tgz";
      path = fetchurl {
        name = "postcss_merge_rules___postcss_merge_rules_4.0.3.tgz";
        url  = "https://registry.yarnpkg.com/postcss-merge-rules/-/postcss-merge-rules-4.0.3.tgz";
        sha1 = "362bea4ff5a1f98e4075a713c6cb25aefef9a650";
      };
    }
    {
      name = "postcss_minify_font_values___postcss_minify_font_values_4.0.2.tgz";
      path = fetchurl {
        name = "postcss_minify_font_values___postcss_minify_font_values_4.0.2.tgz";
        url  = "https://registry.yarnpkg.com/postcss-minify-font-values/-/postcss-minify-font-values-4.0.2.tgz";
        sha1 = "cd4c344cce474343fac5d82206ab2cbcb8afd5a6";
      };
    }
    {
      name = "postcss_minify_gradients___postcss_minify_gradients_4.0.2.tgz";
      path = fetchurl {
        name = "postcss_minify_gradients___postcss_minify_gradients_4.0.2.tgz";
        url  = "https://registry.yarnpkg.com/postcss-minify-gradients/-/postcss-minify-gradients-4.0.2.tgz";
        sha1 = "93b29c2ff5099c535eecda56c4aa6e665a663471";
      };
    }
    {
      name = "postcss_minify_params___postcss_minify_params_4.0.2.tgz";
      path = fetchurl {
        name = "postcss_minify_params___postcss_minify_params_4.0.2.tgz";
        url  = "https://registry.yarnpkg.com/postcss-minify-params/-/postcss-minify-params-4.0.2.tgz";
        sha1 = "6b9cef030c11e35261f95f618c90036d680db874";
      };
    }
    {
      name = "postcss_minify_selectors___postcss_minify_selectors_4.0.2.tgz";
      path = fetchurl {
        name = "postcss_minify_selectors___postcss_minify_selectors_4.0.2.tgz";
        url  = "https://registry.yarnpkg.com/postcss-minify-selectors/-/postcss-minify-selectors-4.0.2.tgz";
        sha1 = "e2e5eb40bfee500d0cd9243500f5f8ea4262fbd8";
      };
    }
    {
      name = "postcss_modules_extract_imports___postcss_modules_extract_imports_1.1.0.tgz";
      path = fetchurl {
        name = "postcss_modules_extract_imports___postcss_modules_extract_imports_1.1.0.tgz";
        url  = "https://registry.yarnpkg.com/postcss-modules-extract-imports/-/postcss-modules-extract-imports-1.1.0.tgz";
        sha1 = "b614c9720be6816eaee35fb3a5faa1dba6a05ddb";
      };
    }
    {
      name = "postcss_modules_local_by_default___postcss_modules_local_by_default_1.2.0.tgz";
      path = fetchurl {
        name = "postcss_modules_local_by_default___postcss_modules_local_by_default_1.2.0.tgz";
        url  = "https://registry.yarnpkg.com/postcss-modules-local-by-default/-/postcss-modules-local-by-default-1.2.0.tgz";
        sha1 = "f7d80c398c5a393fa7964466bd19500a7d61c069";
      };
    }
    {
      name = "postcss_modules_scope___postcss_modules_scope_1.1.0.tgz";
      path = fetchurl {
        name = "postcss_modules_scope___postcss_modules_scope_1.1.0.tgz";
        url  = "https://registry.yarnpkg.com/postcss-modules-scope/-/postcss-modules-scope-1.1.0.tgz";
        sha1 = "d6ea64994c79f97b62a72b426fbe6056a194bb90";
      };
    }
    {
      name = "postcss_modules_values___postcss_modules_values_1.3.0.tgz";
      path = fetchurl {
        name = "postcss_modules_values___postcss_modules_values_1.3.0.tgz";
        url  = "https://registry.yarnpkg.com/postcss-modules-values/-/postcss-modules-values-1.3.0.tgz";
        sha1 = "ecffa9d7e192518389f42ad0e83f72aec456ea20";
      };
    }
    {
      name = "postcss_nested___postcss_nested_4.2.1.tgz";
      path = fetchurl {
        name = "postcss_nested___postcss_nested_4.2.1.tgz";
        url  = "https://registry.yarnpkg.com/postcss-nested/-/postcss-nested-4.2.1.tgz";
        sha1 = "4bc2e5b35e3b1e481ff81e23b700da7f82a8b248";
      };
    }
    {
      name = "postcss_normalize_charset___postcss_normalize_charset_4.0.1.tgz";
      path = fetchurl {
        name = "postcss_normalize_charset___postcss_normalize_charset_4.0.1.tgz";
        url  = "https://registry.yarnpkg.com/postcss-normalize-charset/-/postcss-normalize-charset-4.0.1.tgz";
        sha1 = "8b35add3aee83a136b0471e0d59be58a50285dd4";
      };
    }
    {
      name = "postcss_normalize_display_values___postcss_normalize_display_values_4.0.2.tgz";
      path = fetchurl {
        name = "postcss_normalize_display_values___postcss_normalize_display_values_4.0.2.tgz";
        url  = "https://registry.yarnpkg.com/postcss-normalize-display-values/-/postcss-normalize-display-values-4.0.2.tgz";
        sha1 = "0dbe04a4ce9063d4667ed2be476bb830c825935a";
      };
    }
    {
      name = "postcss_normalize_positions___postcss_normalize_positions_4.0.2.tgz";
      path = fetchurl {
        name = "postcss_normalize_positions___postcss_normalize_positions_4.0.2.tgz";
        url  = "https://registry.yarnpkg.com/postcss-normalize-positions/-/postcss-normalize-positions-4.0.2.tgz";
        sha1 = "05f757f84f260437378368a91f8932d4b102917f";
      };
    }
    {
      name = "postcss_normalize_repeat_style___postcss_normalize_repeat_style_4.0.2.tgz";
      path = fetchurl {
        name = "postcss_normalize_repeat_style___postcss_normalize_repeat_style_4.0.2.tgz";
        url  = "https://registry.yarnpkg.com/postcss-normalize-repeat-style/-/postcss-normalize-repeat-style-4.0.2.tgz";
        sha1 = "c4ebbc289f3991a028d44751cbdd11918b17910c";
      };
    }
    {
      name = "postcss_normalize_string___postcss_normalize_string_4.0.2.tgz";
      path = fetchurl {
        name = "postcss_normalize_string___postcss_normalize_string_4.0.2.tgz";
        url  = "https://registry.yarnpkg.com/postcss-normalize-string/-/postcss-normalize-string-4.0.2.tgz";
        sha1 = "cd44c40ab07a0c7a36dc5e99aace1eca4ec2690c";
      };
    }
    {
      name = "postcss_normalize_timing_functions___postcss_normalize_timing_functions_4.0.2.tgz";
      path = fetchurl {
        name = "postcss_normalize_timing_functions___postcss_normalize_timing_functions_4.0.2.tgz";
        url  = "https://registry.yarnpkg.com/postcss-normalize-timing-functions/-/postcss-normalize-timing-functions-4.0.2.tgz";
        sha1 = "8e009ca2a3949cdaf8ad23e6b6ab99cb5e7d28d9";
      };
    }
    {
      name = "postcss_normalize_unicode___postcss_normalize_unicode_4.0.1.tgz";
      path = fetchurl {
        name = "postcss_normalize_unicode___postcss_normalize_unicode_4.0.1.tgz";
        url  = "https://registry.yarnpkg.com/postcss-normalize-unicode/-/postcss-normalize-unicode-4.0.1.tgz";
        sha1 = "841bd48fdcf3019ad4baa7493a3d363b52ae1cfb";
      };
    }
    {
      name = "postcss_normalize_url___postcss_normalize_url_4.0.1.tgz";
      path = fetchurl {
        name = "postcss_normalize_url___postcss_normalize_url_4.0.1.tgz";
        url  = "https://registry.yarnpkg.com/postcss-normalize-url/-/postcss-normalize-url-4.0.1.tgz";
        sha1 = "10e437f86bc7c7e58f7b9652ed878daaa95faae1";
      };
    }
    {
      name = "postcss_normalize_whitespace___postcss_normalize_whitespace_4.0.2.tgz";
      path = fetchurl {
        name = "postcss_normalize_whitespace___postcss_normalize_whitespace_4.0.2.tgz";
        url  = "https://registry.yarnpkg.com/postcss-normalize-whitespace/-/postcss-normalize-whitespace-4.0.2.tgz";
        sha1 = "bf1d4070fe4fcea87d1348e825d8cc0c5faa7d82";
      };
    }
    {
      name = "postcss_ordered_values___postcss_ordered_values_4.1.2.tgz";
      path = fetchurl {
        name = "postcss_ordered_values___postcss_ordered_values_4.1.2.tgz";
        url  = "https://registry.yarnpkg.com/postcss-ordered-values/-/postcss-ordered-values-4.1.2.tgz";
        sha1 = "0cf75c820ec7d5c4d280189559e0b571ebac0eee";
      };
    }
    {
      name = "postcss_reduce_initial___postcss_reduce_initial_4.0.3.tgz";
      path = fetchurl {
        name = "postcss_reduce_initial___postcss_reduce_initial_4.0.3.tgz";
        url  = "https://registry.yarnpkg.com/postcss-reduce-initial/-/postcss-reduce-initial-4.0.3.tgz";
        sha1 = "7fd42ebea5e9c814609639e2c2e84ae270ba48df";
      };
    }
    {
      name = "postcss_reduce_transforms___postcss_reduce_transforms_4.0.2.tgz";
      path = fetchurl {
        name = "postcss_reduce_transforms___postcss_reduce_transforms_4.0.2.tgz";
        url  = "https://registry.yarnpkg.com/postcss-reduce-transforms/-/postcss-reduce-transforms-4.0.2.tgz";
        sha1 = "17efa405eacc6e07be3414a5ca2d1074681d4e29";
      };
    }
    {
      name = "postcss_reporter___postcss_reporter_6.0.1.tgz";
      path = fetchurl {
        name = "postcss_reporter___postcss_reporter_6.0.1.tgz";
        url  = "https://registry.yarnpkg.com/postcss-reporter/-/postcss-reporter-6.0.1.tgz";
        sha1 = "7c055120060a97c8837b4e48215661aafb74245f";
      };
    }
    {
      name = "postcss_selector_parser___postcss_selector_parser_6.0.2.tgz";
      path = fetchurl {
        name = "postcss_selector_parser___postcss_selector_parser_6.0.2.tgz";
        url  = "https://registry.yarnpkg.com/postcss-selector-parser/-/postcss-selector-parser-6.0.2.tgz";
        sha1 = "934cf799d016c83411859e09dcecade01286ec5c";
      };
    }
    {
      name = "postcss_selector_parser___postcss_selector_parser_3.1.2.tgz";
      path = fetchurl {
        name = "postcss_selector_parser___postcss_selector_parser_3.1.2.tgz";
        url  = "https://registry.yarnpkg.com/postcss-selector-parser/-/postcss-selector-parser-3.1.2.tgz";
        sha1 = "b310f5c4c0fdaf76f94902bbaa30db6aa84f5270";
      };
    }
    {
      name = "postcss_svgo___postcss_svgo_4.0.2.tgz";
      path = fetchurl {
        name = "postcss_svgo___postcss_svgo_4.0.2.tgz";
        url  = "https://registry.yarnpkg.com/postcss-svgo/-/postcss-svgo-4.0.2.tgz";
        sha1 = "17b997bc711b333bab143aaed3b8d3d6e3d38258";
      };
    }
    {
      name = "postcss_unique_selectors___postcss_unique_selectors_4.0.1.tgz";
      path = fetchurl {
        name = "postcss_unique_selectors___postcss_unique_selectors_4.0.1.tgz";
        url  = "https://registry.yarnpkg.com/postcss-unique-selectors/-/postcss-unique-selectors-4.0.1.tgz";
        sha1 = "9446911f3289bfd64c6d680f073c03b1f9ee4bac";
      };
    }
    {
      name = "postcss_value_parser___postcss_value_parser_3.3.1.tgz";
      path = fetchurl {
        name = "postcss_value_parser___postcss_value_parser_3.3.1.tgz";
        url  = "https://registry.yarnpkg.com/postcss-value-parser/-/postcss-value-parser-3.3.1.tgz";
        sha1 = "9ff822547e2893213cf1c30efa51ac5fd1ba8281";
      };
    }
    {
      name = "postcss_value_parser___postcss_value_parser_4.1.0.tgz";
      path = fetchurl {
        name = "postcss_value_parser___postcss_value_parser_4.1.0.tgz";
        url  = "https://registry.yarnpkg.com/postcss-value-parser/-/postcss-value-parser-4.1.0.tgz";
        sha1 = "443f6a20ced6481a2bda4fa8532a6e55d789a2cb";
      };
    }
    {
      name = "postcss___postcss_6.0.1.tgz";
      path = fetchurl {
        name = "postcss___postcss_6.0.1.tgz";
        url  = "https://registry.yarnpkg.com/postcss/-/postcss-6.0.1.tgz";
        sha1 = "000dbd1f8eef217aa368b9a212c5fc40b2a8f3f2";
      };
    }
    {
      name = "postcss___postcss_6.0.23.tgz";
      path = fetchurl {
        name = "postcss___postcss_6.0.23.tgz";
        url  = "https://registry.yarnpkg.com/postcss/-/postcss-6.0.23.tgz";
        sha1 = "61c82cc328ac60e677645f979054eb98bc0e3324";
      };
    }
    {
      name = "postcss___postcss_7.0.27.tgz";
      path = fetchurl {
        name = "postcss___postcss_7.0.27.tgz";
        url  = "https://registry.yarnpkg.com/postcss/-/postcss-7.0.27.tgz";
        sha1 = "cc67cdc6b0daa375105b7c424a85567345fc54d9";
      };
    }
    {
      name = "posthtml_parser___posthtml_parser_0.4.2.tgz";
      path = fetchurl {
        name = "posthtml_parser___posthtml_parser_0.4.2.tgz";
        url  = "https://registry.yarnpkg.com/posthtml-parser/-/posthtml-parser-0.4.2.tgz";
        sha1 = "a132bbdf0cd4bc199d34f322f5c1599385d7c6c1";
      };
    }
    {
      name = "posthtml_render___posthtml_render_1.2.2.tgz";
      path = fetchurl {
        name = "posthtml_render___posthtml_render_1.2.2.tgz";
        url  = "https://registry.yarnpkg.com/posthtml-render/-/posthtml-render-1.2.2.tgz";
        sha1 = "f554a19ed40d40e2bfc160826b0a91d4a23656cd";
      };
    }
    {
      name = "posthtml___posthtml_0.11.6.tgz";
      path = fetchurl {
        name = "posthtml___posthtml_0.11.6.tgz";
        url  = "https://registry.yarnpkg.com/posthtml/-/posthtml-0.11.6.tgz";
        sha1 = "e349d51af7929d0683b9d8c3abd8166beecc90a8";
      };
    }
    {
      name = "posthtml___posthtml_0.12.3.tgz";
      path = fetchurl {
        name = "posthtml___posthtml_0.12.3.tgz";
        url  = "https://registry.yarnpkg.com/posthtml/-/posthtml-0.12.3.tgz";
        sha1 = "8fa5b903907e9c10ba5b883863cc550189a309d5";
      };
    }
    {
      name = "prelude_ls___prelude_ls_1.1.2.tgz";
      path = fetchurl {
        name = "prelude_ls___prelude_ls_1.1.2.tgz";
        url  = "https://registry.yarnpkg.com/prelude-ls/-/prelude-ls-1.1.2.tgz";
        sha1 = "21932a549f5e52ffd9a827f570e04be62a97da54";
      };
    }
    {
      name = "prepend_http___prepend_http_1.0.4.tgz";
      path = fetchurl {
        name = "prepend_http___prepend_http_1.0.4.tgz";
        url  = "https://registry.yarnpkg.com/prepend-http/-/prepend-http-1.0.4.tgz";
        sha1 = "d4f4562b0ce3696e41ac52d0e002e57a635dc6dc";
      };
    }
    {
      name = "pretty_format___pretty_format_25.5.0.tgz";
      path = fetchurl {
        name = "pretty_format___pretty_format_25.5.0.tgz";
        url  = "https://registry.yarnpkg.com/pretty-format/-/pretty-format-25.5.0.tgz";
        sha1 = "7873c1d774f682c34b8d48b6743a2bf2ac55791a";
      };
    }
    {
      name = "pretty_hrtime___pretty_hrtime_1.0.3.tgz";
      path = fetchurl {
        name = "pretty_hrtime___pretty_hrtime_1.0.3.tgz";
        url  = "https://registry.yarnpkg.com/pretty-hrtime/-/pretty-hrtime-1.0.3.tgz";
        sha1 = "b7e3ea42435a4c9b2759d99e0f201eb195802ee1";
      };
    }
    {
      name = "prismjs___prismjs_1.26.0.tgz";
      path = fetchurl {
        name = "prismjs___prismjs_1.26.0.tgz";
        url  = "https://registry.yarnpkg.com/prismjs/-/prismjs-1.26.0.tgz";
        sha1 = "16881b594828bb6b45296083a8cbab46b0accd47";
      };
    }
    {
      name = "private___private_0.1.8.tgz";
      path = fetchurl {
        name = "private___private_0.1.8.tgz";
        url  = "https://registry.yarnpkg.com/private/-/private-0.1.8.tgz";
        sha1 = "2381edb3689f7a53d653190060fcf822d2f368ff";
      };
    }
    {
      name = "process_nextick_args___process_nextick_args_2.0.1.tgz";
      path = fetchurl {
        name = "process_nextick_args___process_nextick_args_2.0.1.tgz";
        url  = "https://registry.yarnpkg.com/process-nextick-args/-/process-nextick-args-2.0.1.tgz";
        sha1 = "7820d9b16120cc55ca9ae7792680ae7dba6d7fe2";
      };
    }
    {
      name = "process___process_0.11.10.tgz";
      path = fetchurl {
        name = "process___process_0.11.10.tgz";
        url  = "https://registry.yarnpkg.com/process/-/process-0.11.10.tgz";
        sha1 = "7332300e840161bda3e69a1d1d91a7d4bc16f182";
      };
    }
    {
      name = "promise___promise_7.3.1.tgz";
      path = fetchurl {
        name = "promise___promise_7.3.1.tgz";
        url  = "https://registry.yarnpkg.com/promise/-/promise-7.3.1.tgz";
        sha1 = "064b72602b18f90f29192b8b1bc418ffd1ebd3bf";
      };
    }
    {
      name = "prompts___prompts_2.3.2.tgz";
      path = fetchurl {
        name = "prompts___prompts_2.3.2.tgz";
        url  = "https://registry.yarnpkg.com/prompts/-/prompts-2.3.2.tgz";
        sha1 = "480572d89ecf39566d2bd3fe2c9fccb7c4c0b068";
      };
    }
    {
      name = "prop_types___prop_types_15.7.2.tgz";
      path = fetchurl {
        name = "prop_types___prop_types_15.7.2.tgz";
        url  = "https://registry.yarnpkg.com/prop-types/-/prop-types-15.7.2.tgz";
        sha1 = "52c41e75b8c87e72b9d9360e0206b99dcbffa6c5";
      };
    }
    {
      name = "proto_list___proto_list_1.2.4.tgz";
      path = fetchurl {
        name = "proto_list___proto_list_1.2.4.tgz";
        url  = "https://registry.yarnpkg.com/proto-list/-/proto-list-1.2.4.tgz";
        sha1 = "212d5bfe1318306a420f6402b8e26ff39647a849";
      };
    }
    {
      name = "prr___prr_1.0.1.tgz";
      path = fetchurl {
        name = "prr___prr_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/prr/-/prr-1.0.1.tgz";
        sha1 = "d3fc114ba06995a45ec6893f484ceb1d78f5f476";
      };
    }
    {
      name = "pseudomap___pseudomap_1.0.2.tgz";
      path = fetchurl {
        name = "pseudomap___pseudomap_1.0.2.tgz";
        url  = "https://registry.yarnpkg.com/pseudomap/-/pseudomap-1.0.2.tgz";
        sha1 = "f052a28da70e618917ef0a8ac34c1ae5a68286b3";
      };
    }
    {
      name = "psl___psl_1.8.0.tgz";
      path = fetchurl {
        name = "psl___psl_1.8.0.tgz";
        url  = "https://registry.yarnpkg.com/psl/-/psl-1.8.0.tgz";
        sha1 = "9326f8bcfb013adcc005fdff056acce020e51c24";
      };
    }
    {
      name = "public_encrypt___public_encrypt_4.0.3.tgz";
      path = fetchurl {
        name = "public_encrypt___public_encrypt_4.0.3.tgz";
        url  = "https://registry.yarnpkg.com/public-encrypt/-/public-encrypt-4.0.3.tgz";
        sha1 = "4fcc9d77a07e48ba7527e7cbe0de33d0701331e0";
      };
    }
    {
      name = "pump___pump_3.0.0.tgz";
      path = fetchurl {
        name = "pump___pump_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/pump/-/pump-3.0.0.tgz";
        sha1 = "b4a2116815bde2f4e1ea602354e8c75565107a64";
      };
    }
    {
      name = "punycode___punycode_1.3.2.tgz";
      path = fetchurl {
        name = "punycode___punycode_1.3.2.tgz";
        url  = "https://registry.yarnpkg.com/punycode/-/punycode-1.3.2.tgz";
        sha1 = "9653a036fb7c1ee42342f2325cceefea3926c48d";
      };
    }
    {
      name = "punycode___punycode_1.4.1.tgz";
      path = fetchurl {
        name = "punycode___punycode_1.4.1.tgz";
        url  = "https://registry.yarnpkg.com/punycode/-/punycode-1.4.1.tgz";
        sha1 = "c0d5a63b2718800ad8e1eb0fa5269c84dd41845e";
      };
    }
    {
      name = "punycode___punycode_2.1.1.tgz";
      path = fetchurl {
        name = "punycode___punycode_2.1.1.tgz";
        url  = "https://registry.yarnpkg.com/punycode/-/punycode-2.1.1.tgz";
        sha1 = "b58b010ac40c22c5657616c8d2c2c02c7bf479ec";
      };
    }
    {
      name = "purgecss___purgecss_1.4.2.tgz";
      path = fetchurl {
        name = "purgecss___purgecss_1.4.2.tgz";
        url  = "https://registry.yarnpkg.com/purgecss/-/purgecss-1.4.2.tgz";
        sha1 = "67ab50cb4f5c163fcefde56002467c974e577f41";
      };
    }
    {
      name = "q___q_1.5.1.tgz";
      path = fetchurl {
        name = "q___q_1.5.1.tgz";
        url  = "https://registry.yarnpkg.com/q/-/q-1.5.1.tgz";
        sha1 = "7e32f75b41381291d04611f1bf14109ac00651d7";
      };
    }
    {
      name = "qs___qs_6.5.2.tgz";
      path = fetchurl {
        name = "qs___qs_6.5.2.tgz";
        url  = "https://registry.yarnpkg.com/qs/-/qs-6.5.2.tgz";
        sha1 = "cb3ae806e8740444584ef154ce8ee98d403f3e36";
      };
    }
    {
      name = "query_string___query_string_4.3.4.tgz";
      path = fetchurl {
        name = "query_string___query_string_4.3.4.tgz";
        url  = "https://registry.yarnpkg.com/query-string/-/query-string-4.3.4.tgz";
        sha1 = "bbb693b9ca915c232515b228b1a02b609043dbeb";
      };
    }
    {
      name = "querystring_es3___querystring_es3_0.2.1.tgz";
      path = fetchurl {
        name = "querystring_es3___querystring_es3_0.2.1.tgz";
        url  = "https://registry.yarnpkg.com/querystring-es3/-/querystring-es3-0.2.1.tgz";
        sha1 = "9ec61f79049875707d69414596fd907a4d711e73";
      };
    }
    {
      name = "querystring___querystring_0.2.0.tgz";
      path = fetchurl {
        name = "querystring___querystring_0.2.0.tgz";
        url  = "https://registry.yarnpkg.com/querystring/-/querystring-0.2.0.tgz";
        sha1 = "b209849203bb25df820da756e747005878521620";
      };
    }
    {
      name = "quote_stream___quote_stream_1.0.2.tgz";
      path = fetchurl {
        name = "quote_stream___quote_stream_1.0.2.tgz";
        url  = "https://registry.yarnpkg.com/quote-stream/-/quote-stream-1.0.2.tgz";
        sha1 = "84963f8c9c26b942e153feeb53aae74652b7e0b2";
      };
    }
    {
      name = "raf___raf_3.4.1.tgz";
      path = fetchurl {
        name = "raf___raf_3.4.1.tgz";
        url  = "https://registry.yarnpkg.com/raf/-/raf-3.4.1.tgz";
        sha1 = "0742e99a4a6552f445d73e3ee0328af0ff1ede39";
      };
    }
    {
      name = "randombytes___randombytes_2.1.0.tgz";
      path = fetchurl {
        name = "randombytes___randombytes_2.1.0.tgz";
        url  = "https://registry.yarnpkg.com/randombytes/-/randombytes-2.1.0.tgz";
        sha1 = "df6f84372f0270dc65cdf6291349ab7a473d4f2a";
      };
    }
    {
      name = "randomfill___randomfill_1.0.4.tgz";
      path = fetchurl {
        name = "randomfill___randomfill_1.0.4.tgz";
        url  = "https://registry.yarnpkg.com/randomfill/-/randomfill-1.0.4.tgz";
        sha1 = "c92196fc86ab42be983f1bf31778224931d61458";
      };
    }
    {
      name = "range_parser___range_parser_1.2.1.tgz";
      path = fetchurl {
        name = "range_parser___range_parser_1.2.1.tgz";
        url  = "https://registry.yarnpkg.com/range-parser/-/range-parser-1.2.1.tgz";
        sha1 = "3cf37023d199e1c24d1a55b84800c2f3e6468031";
      };
    }
    {
      name = "rationale___rationale_0.2.0.tgz";
      path = fetchurl {
        name = "rationale___rationale_0.2.0.tgz";
        url  = "https://registry.yarnpkg.com/rationale/-/rationale-0.2.0.tgz";
        sha1 = "555ed4f3cc7cd0245faeac041d3769f1857e4f3d";
      };
    }
    {
      name = "rc_align___rc_align_2.4.5.tgz";
      path = fetchurl {
        name = "rc_align___rc_align_2.4.5.tgz";
        url  = "https://registry.yarnpkg.com/rc-align/-/rc-align-2.4.5.tgz";
        sha1 = "c941a586f59d1017f23a428f0b468663fb7102ab";
      };
    }
    {
      name = "rc_align___rc_align_3.0.0_rc.1.tgz";
      path = fetchurl {
        name = "rc_align___rc_align_3.0.0_rc.1.tgz";
        url  = "https://registry.yarnpkg.com/rc-align/-/rc-align-3.0.0-rc.1.tgz";
        sha1 = "32d1fac860d12bb85e9b8cafbbdef79f3f537674";
      };
    }
    {
      name = "rc_animate___rc_animate_2.11.1.tgz";
      path = fetchurl {
        name = "rc_animate___rc_animate_2.11.1.tgz";
        url  = "https://registry.yarnpkg.com/rc-animate/-/rc-animate-2.11.1.tgz";
        sha1 = "2666eeb6f1f2a495a13b2af09e236712278fdb2c";
      };
    }
    {
      name = "rc_animate___rc_animate_3.0.0_rc.6.tgz";
      path = fetchurl {
        name = "rc_animate___rc_animate_3.0.0_rc.6.tgz";
        url  = "https://registry.yarnpkg.com/rc-animate/-/rc-animate-3.0.0-rc.6.tgz";
        sha1 = "04288eefa118e0cae214536c8a903ffaac1bc3fb";
      };
    }
    {
      name = "rc_calendar___rc_calendar_9.12.4.tgz";
      path = fetchurl {
        name = "rc_calendar___rc_calendar_9.12.4.tgz";
        url  = "https://registry.yarnpkg.com/rc-calendar/-/rc-calendar-9.12.4.tgz";
        sha1 = "68ee3a857b5341d780d9473541926cfe0b449154";
      };
    }
    {
      name = "rc_cascader___rc_cascader_0.17.5.tgz";
      path = fetchurl {
        name = "rc_cascader___rc_cascader_0.17.5.tgz";
        url  = "https://registry.yarnpkg.com/rc-cascader/-/rc-cascader-0.17.5.tgz";
        sha1 = "4fde91d23b7608c420263c38eee9c0687f80f7dc";
      };
    }
    {
      name = "rc_checkbox___rc_checkbox_2.1.8.tgz";
      path = fetchurl {
        name = "rc_checkbox___rc_checkbox_2.1.8.tgz";
        url  = "https://registry.yarnpkg.com/rc-checkbox/-/rc-checkbox-2.1.8.tgz";
        sha1 = "eedd9ef9c2f3af5b3b8e5cde5254aa89ad1a880a";
      };
    }
    {
      name = "rc_collapse___rc_collapse_1.11.8.tgz";
      path = fetchurl {
        name = "rc_collapse___rc_collapse_1.11.8.tgz";
        url  = "https://registry.yarnpkg.com/rc-collapse/-/rc-collapse-1.11.8.tgz";
        sha1 = "66a40089d469519e9424009ab1c927e214041d80";
      };
    }
    {
      name = "rc_dialog___rc_dialog_7.3.1.tgz";
      path = fetchurl {
        name = "rc_dialog___rc_dialog_7.3.1.tgz";
        url  = "https://registry.yarnpkg.com/rc-dialog/-/rc-dialog-7.3.1.tgz";
        sha1 = "45041ec35bfc8e337c91b64b52cebef6ea5cd4a2";
      };
    }
    {
      name = "rc_drawer___rc_drawer_1.8.3.tgz";
      path = fetchurl {
        name = "rc_drawer___rc_drawer_1.8.3.tgz";
        url  = "https://registry.yarnpkg.com/rc-drawer/-/rc-drawer-1.8.3.tgz";
        sha1 = "5d477e254419569f1d54b097c4161921b73238b8";
      };
    }
    {
      name = "rc_dropdown___rc_dropdown_3.0.2.tgz";
      path = fetchurl {
        name = "rc_dropdown___rc_dropdown_3.0.2.tgz";
        url  = "https://registry.yarnpkg.com/rc-dropdown/-/rc-dropdown-3.0.2.tgz";
        sha1 = "e486b67f5e8e8b9e326426d5a80254621453d66a";
      };
    }
    {
      name = "rc_dropdown___rc_dropdown_2.4.1.tgz";
      path = fetchurl {
        name = "rc_dropdown___rc_dropdown_2.4.1.tgz";
        url  = "https://registry.yarnpkg.com/rc-dropdown/-/rc-dropdown-2.4.1.tgz";
        sha1 = "aaef6eb3a5152cdd9982895c2a78d9b5f046cdec";
      };
    }
    {
      name = "rc_editor_core___rc_editor_core_0.8.10.tgz";
      path = fetchurl {
        name = "rc_editor_core___rc_editor_core_0.8.10.tgz";
        url  = "https://registry.yarnpkg.com/rc-editor-core/-/rc-editor-core-0.8.10.tgz";
        sha1 = "6f215bc5df9c33ffa9f6c5b30ca73a7dabe8ab7c";
      };
    }
    {
      name = "rc_editor_mention___rc_editor_mention_1.1.13.tgz";
      path = fetchurl {
        name = "rc_editor_mention___rc_editor_mention_1.1.13.tgz";
        url  = "https://registry.yarnpkg.com/rc-editor-mention/-/rc-editor-mention-1.1.13.tgz";
        sha1 = "9f1cab1065f86b01523840321790c2ab12ac5e8b";
      };
    }
    {
      name = "rc_form___rc_form_2.4.11.tgz";
      path = fetchurl {
        name = "rc_form___rc_form_2.4.11.tgz";
        url  = "https://registry.yarnpkg.com/rc-form/-/rc-form-2.4.11.tgz";
        sha1 = "61ee3ae579259684ae30f2c48f55f0f23a5d3d08";
      };
    }
    {
      name = "rc_hammerjs___rc_hammerjs_0.6.9.tgz";
      path = fetchurl {
        name = "rc_hammerjs___rc_hammerjs_0.6.9.tgz";
        url  = "https://registry.yarnpkg.com/rc-hammerjs/-/rc-hammerjs-0.6.9.tgz";
        sha1 = "9a4ddbda1b2ec8f9b9596091a6a989842a243907";
      };
    }
    {
      name = "rc_input_number___rc_input_number_4.4.5.tgz";
      path = fetchurl {
        name = "rc_input_number___rc_input_number_4.4.5.tgz";
        url  = "https://registry.yarnpkg.com/rc-input-number/-/rc-input-number-4.4.5.tgz";
        sha1 = "81473d2885a6b312e486c4f2ba3f441c1ab88520";
      };
    }
    {
      name = "rc_menu___rc_menu_8.0.3.tgz";
      path = fetchurl {
        name = "rc_menu___rc_menu_8.0.3.tgz";
        url  = "https://registry.yarnpkg.com/rc-menu/-/rc-menu-8.0.3.tgz";
        sha1 = "d553eaa892da6c02c74c9b1d2e778f140ace4d99";
      };
    }
    {
      name = "rc_menu___rc_menu_7.5.5.tgz";
      path = fetchurl {
        name = "rc_menu___rc_menu_7.5.5.tgz";
        url  = "https://registry.yarnpkg.com/rc-menu/-/rc-menu-7.5.5.tgz";
        sha1 = "78cdc817d86fc353a1430b864d3d96c7489600ca";
      };
    }
    {
      name = "rc_menu___rc_menu_7.4.32.tgz";
      path = fetchurl {
        name = "rc_menu___rc_menu_7.4.32.tgz";
        url  = "https://registry.yarnpkg.com/rc-menu/-/rc-menu-7.4.32.tgz";
        sha1 = "71409216daaa9f43d8acc4530628879740d63708";
      };
    }
    {
      name = "rc_notification___rc_notification_3.3.1.tgz";
      path = fetchurl {
        name = "rc_notification___rc_notification_3.3.1.tgz";
        url  = "https://registry.yarnpkg.com/rc-notification/-/rc-notification-3.3.1.tgz";
        sha1 = "0baa3e70f8d40ab015ce8fa78c260c490fc7beb4";
      };
    }
    {
      name = "rc_pagination___rc_pagination_1.17.14.tgz";
      path = fetchurl {
        name = "rc_pagination___rc_pagination_1.17.14.tgz";
        url  = "https://registry.yarnpkg.com/rc-pagination/-/rc-pagination-1.17.14.tgz";
        sha1 = "ffb2882fd89d95b3b603938dc5db2fb2c30026d3";
      };
    }
    {
      name = "rc_progress___rc_progress_2.3.0.tgz";
      path = fetchurl {
        name = "rc_progress___rc_progress_2.3.0.tgz";
        url  = "https://registry.yarnpkg.com/rc-progress/-/rc-progress-2.3.0.tgz";
        sha1 = "cfbd07ff9026c450100980de209a92650e24f313";
      };
    }
    {
      name = "rc_rate___rc_rate_2.5.1.tgz";
      path = fetchurl {
        name = "rc_rate___rc_rate_2.5.1.tgz";
        url  = "https://registry.yarnpkg.com/rc-rate/-/rc-rate-2.5.1.tgz";
        sha1 = "55fc5fd23ea9dcc72250b9a889803479f4842961";
      };
    }
    {
      name = "rc_select___rc_select_9.1.5.tgz";
      path = fetchurl {
        name = "rc_select___rc_select_9.1.5.tgz";
        url  = "https://registry.yarnpkg.com/rc-select/-/rc-select-9.1.5.tgz";
        sha1 = "6811dd5f984e876cd6baa4767aaf6c152a4a1004";
      };
    }
    {
      name = "rc_slider___rc_slider_8.6.13.tgz";
      path = fetchurl {
        name = "rc_slider___rc_slider_8.6.13.tgz";
        url  = "https://registry.yarnpkg.com/rc-slider/-/rc-slider-8.6.13.tgz";
        sha1 = "88a8150c2dda6709f3f119135de11fba80af765b";
      };
    }
    {
      name = "rc_steps___rc_steps_3.3.1.tgz";
      path = fetchurl {
        name = "rc_steps___rc_steps_3.3.1.tgz";
        url  = "https://registry.yarnpkg.com/rc-steps/-/rc-steps-3.3.1.tgz";
        sha1 = "4877e2897331e3bfdb6b789e88aea78f4f15f732";
      };
    }
    {
      name = "rc_switch___rc_switch_1.9.0.tgz";
      path = fetchurl {
        name = "rc_switch___rc_switch_1.9.0.tgz";
        url  = "https://registry.yarnpkg.com/rc-switch/-/rc-switch-1.9.0.tgz";
        sha1 = "ab2b878f2713c681358a453391976c9b95b290f7";
      };
    }
    {
      name = "rc_table___rc_table_6.5.1.tgz";
      path = fetchurl {
        name = "rc_table___rc_table_6.5.1.tgz";
        url  = "https://registry.yarnpkg.com/rc-table/-/rc-table-6.5.1.tgz";
        sha1 = "b05ef79127e24b353083f8399dedaa9cbfbd16a2";
      };
    }
    {
      name = "rc_tabs___rc_tabs_9.6.7.tgz";
      path = fetchurl {
        name = "rc_tabs___rc_tabs_9.6.7.tgz";
        url  = "https://registry.yarnpkg.com/rc-tabs/-/rc-tabs-9.6.7.tgz";
        sha1 = "c546115a351f5ed779ea5524143157f48ee0c015";
      };
    }
    {
      name = "rc_time_picker___rc_time_picker_3.6.6.tgz";
      path = fetchurl {
        name = "rc_time_picker___rc_time_picker_3.6.6.tgz";
        url  = "https://registry.yarnpkg.com/rc-time-picker/-/rc-time-picker-3.6.6.tgz";
        sha1 = "343390ad1a3a06b49848c266d8311b3c572ca0d1";
      };
    }
    {
      name = "rc_tooltip___rc_tooltip_3.7.3.tgz";
      path = fetchurl {
        name = "rc_tooltip___rc_tooltip_3.7.3.tgz";
        url  = "https://registry.yarnpkg.com/rc-tooltip/-/rc-tooltip-3.7.3.tgz";
        sha1 = "280aec6afcaa44e8dff0480fbaff9e87fc00aecc";
      };
    }
    {
      name = "rc_tree_select___rc_tree_select_2.9.4.tgz";
      path = fetchurl {
        name = "rc_tree_select___rc_tree_select_2.9.4.tgz";
        url  = "https://registry.yarnpkg.com/rc-tree-select/-/rc-tree-select-2.9.4.tgz";
        sha1 = "6aa794e1f0e65c66c406aa0a2a0e74fd0a557b09";
      };
    }
    {
      name = "rc_tree___rc_tree_2.1.4.tgz";
      path = fetchurl {
        name = "rc_tree___rc_tree_2.1.4.tgz";
        url  = "https://registry.yarnpkg.com/rc-tree/-/rc-tree-2.1.4.tgz";
        sha1 = "ef759f3e799a21b43c1ecf9c794ea1c14e70b59b";
      };
    }
    {
      name = "rc_trigger___rc_trigger_2.6.5.tgz";
      path = fetchurl {
        name = "rc_trigger___rc_trigger_2.6.5.tgz";
        url  = "https://registry.yarnpkg.com/rc-trigger/-/rc-trigger-2.6.5.tgz";
        sha1 = "140a857cf28bd0fa01b9aecb1e26a50a700e9885";
      };
    }
    {
      name = "rc_trigger___rc_trigger_3.0.0.tgz";
      path = fetchurl {
        name = "rc_trigger___rc_trigger_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/rc-trigger/-/rc-trigger-3.0.0.tgz";
        sha1 = "f6d9b1da8a26b2b2d1d912a06876c1a486f5980f";
      };
    }
    {
      name = "rc_trigger___rc_trigger_4.0.2.tgz";
      path = fetchurl {
        name = "rc_trigger___rc_trigger_4.0.2.tgz";
        url  = "https://registry.yarnpkg.com/rc-trigger/-/rc-trigger-4.0.2.tgz";
        sha1 = "42fe7bdb6a5b34035e20fa9ebfad69ec948b56be";
      };
    }
    {
      name = "rc_upload___rc_upload_2.6.8.tgz";
      path = fetchurl {
        name = "rc_upload___rc_upload_2.6.8.tgz";
        url  = "https://registry.yarnpkg.com/rc-upload/-/rc-upload-2.6.8.tgz";
        sha1 = "54f2a94150d75cb53754fed3011962d54c3bc6c3";
      };
    }
    {
      name = "rc_util___rc_util_4.20.5.tgz";
      path = fetchurl {
        name = "rc_util___rc_util_4.20.5.tgz";
        url  = "https://registry.yarnpkg.com/rc-util/-/rc-util-4.20.5.tgz";
        sha1 = "f7c77569e971ae6a8ad56f899cadd22275398325";
      };
    }
    {
      name = "re_classnames___re_classnames_4.1.0.tgz";
      path = fetchurl {
        name = "re_classnames___re_classnames_4.1.0.tgz";
        url  = "https://registry.yarnpkg.com/re-classnames/-/re-classnames-4.1.0.tgz";
        sha1 = "a13e1d66d84518f55e78435579bc303f7dba55e1";
      };
    }
    {
      name = "react_ace___react_ace_9.2.0.tgz";
      path = fetchurl {
        name = "react_ace___react_ace_9.2.0.tgz";
        url  = "https://registry.yarnpkg.com/react-ace/-/react-ace-9.2.0.tgz";
        sha1 = "204873cafc2540b9e7580a483ffaccb6acda5edd";
      };
    }
    {
      name = "react_apollo___react_apollo_2.5.8.tgz";
      path = fetchurl {
        name = "react_apollo___react_apollo_2.5.8.tgz";
        url  = "https://registry.yarnpkg.com/react-apollo/-/react-apollo-2.5.8.tgz";
        sha1 = "c7a593b027efeefdd8399885e0ac6bec3b32623c";
      };
    }
    {
      name = "react_dom___react_dom_16.12.0.tgz";
      path = fetchurl {
        name = "react_dom___react_dom_16.12.0.tgz";
        url  = "https://registry.yarnpkg.com/react-dom/-/react-dom-16.12.0.tgz";
        sha1 = "0da4b714b8d13c2038c9396b54a92baea633fe11";
      };
    }
    {
      name = "react_dom___react_dom_16.13.1.tgz";
      path = fetchurl {
        name = "react_dom___react_dom_16.13.1.tgz";
        url  = "https://registry.yarnpkg.com/react-dom/-/react-dom-16.13.1.tgz";
        sha1 = "c1bd37331a0486c078ee54c4740720993b2e0e7f";
      };
    }
    {
      name = "react_dom___react_dom_16.14.0.tgz";
      path = fetchurl {
        name = "react_dom___react_dom_16.14.0.tgz";
        url  = "https://registry.yarnpkg.com/react-dom/-/react-dom-16.14.0.tgz";
        sha1 = "7ad838ec29a777fb3c75c3a190f661cf92ab8b89";
      };
    }
    {
      name = "react_icons_kit___react_icons_kit_1.3.1.tgz";
      path = fetchurl {
        name = "react_icons_kit___react_icons_kit_1.3.1.tgz";
        url  = "https://registry.yarnpkg.com/react-icons-kit/-/react-icons-kit-1.3.1.tgz";
        sha1 = "fbe56ce4379fc4391b4c6dfc1aa96e2b31e23623";
      };
    }
    {
      name = "react_is___react_is_16.13.1.tgz";
      path = fetchurl {
        name = "react_is___react_is_16.13.1.tgz";
        url  = "https://registry.yarnpkg.com/react-is/-/react-is-16.13.1.tgz";
        sha1 = "789729a4dc36de2999dc156dd6c1d9c18cea56a4";
      };
    }
    {
      name = "react_lazy_load___react_lazy_load_3.0.13.tgz";
      path = fetchurl {
        name = "react_lazy_load___react_lazy_load_3.0.13.tgz";
        url  = "https://registry.yarnpkg.com/react-lazy-load/-/react-lazy-load-3.0.13.tgz";
        sha1 = "3b0a92d336d43d3f0d73cbe6f35b17050b08b824";
      };
    }
    {
      name = "react_lifecycles_compat___react_lifecycles_compat_3.0.4.tgz";
      path = fetchurl {
        name = "react_lifecycles_compat___react_lifecycles_compat_3.0.4.tgz";
        url  = "https://registry.yarnpkg.com/react-lifecycles-compat/-/react-lifecycles-compat-3.0.4.tgz";
        sha1 = "4f1a273afdfc8f3488a8c516bfda78f872352362";
      };
    }
    {
      name = "react_slick___react_slick_0.24.0.tgz";
      path = fetchurl {
        name = "react_slick___react_slick_0.24.0.tgz";
        url  = "https://registry.yarnpkg.com/react-slick/-/react-slick-0.24.0.tgz";
        sha1 = "1a4e078a82de4e9458255d9ce26aa6f3b17b168b";
      };
    }
    {
      name = "react_textarea_autosize___react_textarea_autosize_7.1.2.tgz";
      path = fetchurl {
        name = "react_textarea_autosize___react_textarea_autosize_7.1.2.tgz";
        url  = "https://registry.yarnpkg.com/react-textarea-autosize/-/react-textarea-autosize-7.1.2.tgz";
        sha1 = "70fdb333ef86bcca72717e25e623e90c336e2cda";
      };
    }
    {
      name = "react_use___react_use_14.2.0.tgz";
      path = fetchurl {
        name = "react_use___react_use_14.2.0.tgz";
        url  = "https://registry.yarnpkg.com/react-use/-/react-use-14.2.0.tgz";
        sha1 = "abac033fae5e358599b7e38084ff11b02e5d4868";
      };
    }
    {
      name = "react_use___react_use_13.27.1.tgz";
      path = fetchurl {
        name = "react_use___react_use_13.27.1.tgz";
        url  = "https://registry.yarnpkg.com/react-use/-/react-use-13.27.1.tgz";
        sha1 = "e2ae2b708dafc7893c4772628801589aab9de370";
      };
    }
    {
      name = "react_vega___react_vega_7.4.1.tgz";
      path = fetchurl {
        name = "react_vega___react_vega_7.4.1.tgz";
        url  = "https://registry.yarnpkg.com/react-vega/-/react-vega-7.4.1.tgz";
        sha1 = "b81ea5592f68b41b976bcf6948c0bfbefa8e9a2c";
      };
    }
    {
      name = "react___react_16.12.0.tgz";
      path = fetchurl {
        name = "react___react_16.12.0.tgz";
        url  = "https://registry.yarnpkg.com/react/-/react-16.12.0.tgz";
        sha1 = "0c0a9c6a142429e3614834d5a778e18aa78a0b83";
      };
    }
    {
      name = "react___react_16.13.1.tgz";
      path = fetchurl {
        name = "react___react_16.13.1.tgz";
        url  = "https://registry.yarnpkg.com/react/-/react-16.13.1.tgz";
        sha1 = "2e818822f1a9743122c063d6410d85c1e3afe48e";
      };
    }
    {
      name = "react___react_16.14.0.tgz";
      path = fetchurl {
        name = "react___react_16.14.0.tgz";
        url  = "https://registry.yarnpkg.com/react/-/react-16.14.0.tgz";
        sha1 = "94d776ddd0aaa37da3eda8fc5b6b18a4c9a3114d";
      };
    }
    {
      name = "read_cache___read_cache_1.0.0.tgz";
      path = fetchurl {
        name = "read_cache___read_cache_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/read-cache/-/read-cache-1.0.0.tgz";
        sha1 = "e664ef31161166c9751cdbe8dbcf86b5fb58f774";
      };
    }
    {
      name = "read_pkg_up___read_pkg_up_7.0.1.tgz";
      path = fetchurl {
        name = "read_pkg_up___read_pkg_up_7.0.1.tgz";
        url  = "https://registry.yarnpkg.com/read-pkg-up/-/read-pkg-up-7.0.1.tgz";
        sha1 = "f3a6135758459733ae2b95638056e1854e7ef507";
      };
    }
    {
      name = "read_pkg___read_pkg_5.2.0.tgz";
      path = fetchurl {
        name = "read_pkg___read_pkg_5.2.0.tgz";
        url  = "https://registry.yarnpkg.com/read-pkg/-/read-pkg-5.2.0.tgz";
        sha1 = "7bf295438ca5a33e56cd30e053b34ee7250c93cc";
      };
    }
    {
      name = "readable_stream___readable_stream_2.3.7.tgz";
      path = fetchurl {
        name = "readable_stream___readable_stream_2.3.7.tgz";
        url  = "https://registry.yarnpkg.com/readable-stream/-/readable-stream-2.3.7.tgz";
        sha1 = "1eca1cf711aef814c04f62252a36a62f6cb23b57";
      };
    }
    {
      name = "readable_stream___readable_stream_3.6.0.tgz";
      path = fetchurl {
        name = "readable_stream___readable_stream_3.6.0.tgz";
        url  = "https://registry.yarnpkg.com/readable-stream/-/readable-stream-3.6.0.tgz";
        sha1 = "337bbda3adc0706bd3e024426a286d4b4b2c9198";
      };
    }
    {
      name = "readdirp___readdirp_2.2.1.tgz";
      path = fetchurl {
        name = "readdirp___readdirp_2.2.1.tgz";
        url  = "https://registry.yarnpkg.com/readdirp/-/readdirp-2.2.1.tgz";
        sha1 = "0e87622a3325aa33e892285caf8b4e846529a525";
      };
    }
    {
      name = "readdirp___readdirp_3.4.0.tgz";
      path = fetchurl {
        name = "readdirp___readdirp_3.4.0.tgz";
        url  = "https://registry.yarnpkg.com/readdirp/-/readdirp-3.4.0.tgz";
        sha1 = "9fdccdf9e9155805449221ac645e8303ab5b9ada";
      };
    }
    {
      name = "realpath_native___realpath_native_2.0.0.tgz";
      path = fetchurl {
        name = "realpath_native___realpath_native_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/realpath-native/-/realpath-native-2.0.0.tgz";
        sha1 = "7377ac429b6e1fd599dc38d08ed942d0d7beb866";
      };
    }
    {
      name = "reason_apollo___reason_apollo_0.20.0.tgz";
      path = fetchurl {
        name = "reason_apollo___reason_apollo_0.20.0.tgz";
        url  = "https://registry.yarnpkg.com/reason-apollo/-/reason-apollo-0.20.0.tgz";
        sha1 = "102e6047bfc37d9f30462799e7f813d17dd4758a";
      };
    }
    {
      name = "reason_react_compat___reason_react_compat_0.4.0.tgz";
      path = fetchurl {
        name = "reason_react_compat___reason_react_compat_0.4.0.tgz";
        url  = "https://registry.yarnpkg.com/reason-react-compat/-/reason-react-compat-0.4.0.tgz";
        sha1 = "9c6705f9bd67e7ff7219355f3a95fd67442b578d";
      };
    }
    {
      name = "reason_react_update___reason_react_update_2.0.0.tgz";
      path = fetchurl {
        name = "reason_react_update___reason_react_update_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/reason-react-update/-/reason-react-update-2.0.0.tgz";
        sha1 = "64aba8752d212582288996fe988b06087f854b98";
      };
    }
    {
      name = "reason_react___reason_react_0.7.1.tgz";
      path = fetchurl {
        name = "reason_react___reason_react_0.7.1.tgz";
        url  = "https://registry.yarnpkg.com/reason-react/-/reason-react-0.7.1.tgz";
        sha1 = "e6acea88542cd44398cd980093b8a2ab2722744e";
      };
    }
    {
      name = "reduce_css_calc___reduce_css_calc_2.1.7.tgz";
      path = fetchurl {
        name = "reduce_css_calc___reduce_css_calc_2.1.7.tgz";
        url  = "https://registry.yarnpkg.com/reduce-css-calc/-/reduce-css-calc-2.1.7.tgz";
        sha1 = "1ace2e02c286d78abcd01fd92bfe8097ab0602c2";
      };
    }
    {
      name = "regenerate_unicode_properties___regenerate_unicode_properties_8.2.0.tgz";
      path = fetchurl {
        name = "regenerate_unicode_properties___regenerate_unicode_properties_8.2.0.tgz";
        url  = "https://registry.yarnpkg.com/regenerate-unicode-properties/-/regenerate-unicode-properties-8.2.0.tgz";
        sha1 = "e5de7111d655e7ba60c057dbe9ff37c87e65cdec";
      };
    }
    {
      name = "regenerate___regenerate_1.4.0.tgz";
      path = fetchurl {
        name = "regenerate___regenerate_1.4.0.tgz";
        url  = "https://registry.yarnpkg.com/regenerate/-/regenerate-1.4.0.tgz";
        sha1 = "4a856ec4b56e4077c557589cae85e7a4c8869a11";
      };
    }
    {
      name = "regenerator_runtime___regenerator_runtime_0.11.1.tgz";
      path = fetchurl {
        name = "regenerator_runtime___regenerator_runtime_0.11.1.tgz";
        url  = "https://registry.yarnpkg.com/regenerator-runtime/-/regenerator-runtime-0.11.1.tgz";
        sha1 = "be05ad7f9bf7d22e056f9726cee5017fbf19e2e9";
      };
    }
    {
      name = "regenerator_runtime___regenerator_runtime_0.12.1.tgz";
      path = fetchurl {
        name = "regenerator_runtime___regenerator_runtime_0.12.1.tgz";
        url  = "https://registry.yarnpkg.com/regenerator-runtime/-/regenerator-runtime-0.12.1.tgz";
        sha1 = "fa1a71544764c036f8c49b13a08b2594c9f8a0de";
      };
    }
    {
      name = "regenerator_runtime___regenerator_runtime_0.13.5.tgz";
      path = fetchurl {
        name = "regenerator_runtime___regenerator_runtime_0.13.5.tgz";
        url  = "https://registry.yarnpkg.com/regenerator-runtime/-/regenerator-runtime-0.13.5.tgz";
        sha1 = "d878a1d094b4306d10b9096484b33ebd55e26697";
      };
    }
    {
      name = "regenerator_transform___regenerator_transform_0.14.4.tgz";
      path = fetchurl {
        name = "regenerator_transform___regenerator_transform_0.14.4.tgz";
        url  = "https://registry.yarnpkg.com/regenerator-transform/-/regenerator-transform-0.14.4.tgz";
        sha1 = "5266857896518d1616a78a0479337a30ea974cc7";
      };
    }
    {
      name = "regex_not___regex_not_1.0.2.tgz";
      path = fetchurl {
        name = "regex_not___regex_not_1.0.2.tgz";
        url  = "https://registry.yarnpkg.com/regex-not/-/regex-not-1.0.2.tgz";
        sha1 = "1f4ece27e00b0b65e0247a6810e6a85d83a5752c";
      };
    }
    {
      name = "regexpu_core___regexpu_core_4.7.0.tgz";
      path = fetchurl {
        name = "regexpu_core___regexpu_core_4.7.0.tgz";
        url  = "https://registry.yarnpkg.com/regexpu-core/-/regexpu-core-4.7.0.tgz";
        sha1 = "fcbf458c50431b0bb7b45d6967b8192d91f3d938";
      };
    }
    {
      name = "regjsgen___regjsgen_0.5.1.tgz";
      path = fetchurl {
        name = "regjsgen___regjsgen_0.5.1.tgz";
        url  = "https://registry.yarnpkg.com/regjsgen/-/regjsgen-0.5.1.tgz";
        sha1 = "48f0bf1a5ea205196929c0d9798b42d1ed98443c";
      };
    }
    {
      name = "regjsparser___regjsparser_0.6.4.tgz";
      path = fetchurl {
        name = "regjsparser___regjsparser_0.6.4.tgz";
        url  = "https://registry.yarnpkg.com/regjsparser/-/regjsparser-0.6.4.tgz";
        sha1 = "a769f8684308401a66e9b529d2436ff4d0666272";
      };
    }
    {
      name = "remove_trailing_separator___remove_trailing_separator_1.1.0.tgz";
      path = fetchurl {
        name = "remove_trailing_separator___remove_trailing_separator_1.1.0.tgz";
        url  = "https://registry.yarnpkg.com/remove-trailing-separator/-/remove-trailing-separator-1.1.0.tgz";
        sha1 = "c24bce2a283adad5bc3f58e0d48249b92379d8ef";
      };
    }
    {
      name = "repeat_element___repeat_element_1.1.3.tgz";
      path = fetchurl {
        name = "repeat_element___repeat_element_1.1.3.tgz";
        url  = "https://registry.yarnpkg.com/repeat-element/-/repeat-element-1.1.3.tgz";
        sha1 = "782e0d825c0c5a3bb39731f84efee6b742e6b1ce";
      };
    }
    {
      name = "repeat_string___repeat_string_1.6.1.tgz";
      path = fetchurl {
        name = "repeat_string___repeat_string_1.6.1.tgz";
        url  = "https://registry.yarnpkg.com/repeat-string/-/repeat-string-1.6.1.tgz";
        sha1 = "8dcae470e1c88abc2d600fff4a776286da75e637";
      };
    }
    {
      name = "request_promise_core___request_promise_core_1.1.3.tgz";
      path = fetchurl {
        name = "request_promise_core___request_promise_core_1.1.3.tgz";
        url  = "https://registry.yarnpkg.com/request-promise-core/-/request-promise-core-1.1.3.tgz";
        sha1 = "e9a3c081b51380dfea677336061fea879a829ee9";
      };
    }
    {
      name = "request_promise_native___request_promise_native_1.0.8.tgz";
      path = fetchurl {
        name = "request_promise_native___request_promise_native_1.0.8.tgz";
        url  = "https://registry.yarnpkg.com/request-promise-native/-/request-promise-native-1.0.8.tgz";
        sha1 = "a455b960b826e44e2bf8999af64dff2bfe58cb36";
      };
    }
    {
      name = "request___request_2.88.2.tgz";
      path = fetchurl {
        name = "request___request_2.88.2.tgz";
        url  = "https://registry.yarnpkg.com/request/-/request-2.88.2.tgz";
        sha1 = "d73c918731cb5a87da047e207234146f664d12b3";
      };
    }
    {
      name = "require_directory___require_directory_2.1.1.tgz";
      path = fetchurl {
        name = "require_directory___require_directory_2.1.1.tgz";
        url  = "https://registry.yarnpkg.com/require-directory/-/require-directory-2.1.1.tgz";
        sha1 = "8c64ad5fd30dab1c976e2344ffe7f792a6a6df42";
      };
    }
    {
      name = "require_main_filename___require_main_filename_1.0.1.tgz";
      path = fetchurl {
        name = "require_main_filename___require_main_filename_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/require-main-filename/-/require-main-filename-1.0.1.tgz";
        sha1 = "97f717b69d48784f5f526a6c5aa8ffdda055a4d1";
      };
    }
    {
      name = "require_main_filename___require_main_filename_2.0.0.tgz";
      path = fetchurl {
        name = "require_main_filename___require_main_filename_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/require-main-filename/-/require-main-filename-2.0.0.tgz";
        sha1 = "d0b329ecc7cc0f61649f62215be69af54aa8989b";
      };
    }
    {
      name = "reschema___reschema_2.2.0.tgz";
      path = fetchurl {
        name = "reschema___reschema_2.2.0.tgz";
        url  = "https://registry.yarnpkg.com/reschema/-/reschema-2.2.0.tgz";
        sha1 = "e98730d5dff98ec4d99798a31bf1c4a4ebcb8f1c";
      };
    }
    {
      name = "rescript___rescript_9.1.4.tgz";
      path = fetchurl {
        name = "rescript___rescript_9.1.4.tgz";
        url  = "https://registry.yarnpkg.com/rescript/-/rescript-9.1.4.tgz";
        sha1 = "1eb126f98d6c16942c0bf0df67c050198e580515";
      };
    }
    {
      name = "resize_observer_polyfill___resize_observer_polyfill_1.5.1.tgz";
      path = fetchurl {
        name = "resize_observer_polyfill___resize_observer_polyfill_1.5.1.tgz";
        url  = "https://registry.yarnpkg.com/resize-observer-polyfill/-/resize-observer-polyfill-1.5.1.tgz";
        sha1 = "0e9020dd3d21024458d4ebd27e23e40269810464";
      };
    }
    {
      name = "resolve_cwd___resolve_cwd_3.0.0.tgz";
      path = fetchurl {
        name = "resolve_cwd___resolve_cwd_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/resolve-cwd/-/resolve-cwd-3.0.0.tgz";
        sha1 = "0f0075f1bb2544766cf73ba6a6e2adfebcb13f2d";
      };
    }
    {
      name = "resolve_from___resolve_from_3.0.0.tgz";
      path = fetchurl {
        name = "resolve_from___resolve_from_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/resolve-from/-/resolve-from-3.0.0.tgz";
        sha1 = "b22c7af7d9d6881bc8b6e653335eebcb0a188748";
      };
    }
    {
      name = "resolve_from___resolve_from_4.0.0.tgz";
      path = fetchurl {
        name = "resolve_from___resolve_from_4.0.0.tgz";
        url  = "https://registry.yarnpkg.com/resolve-from/-/resolve-from-4.0.0.tgz";
        sha1 = "4abcd852ad32dd7baabfe9b40e00a36db5f392e6";
      };
    }
    {
      name = "resolve_from___resolve_from_5.0.0.tgz";
      path = fetchurl {
        name = "resolve_from___resolve_from_5.0.0.tgz";
        url  = "https://registry.yarnpkg.com/resolve-from/-/resolve-from-5.0.0.tgz";
        sha1 = "c35225843df8f776df21c57557bc087e9dfdfc69";
      };
    }
    {
      name = "resolve_url___resolve_url_0.2.1.tgz";
      path = fetchurl {
        name = "resolve_url___resolve_url_0.2.1.tgz";
        url  = "https://registry.yarnpkg.com/resolve-url/-/resolve-url-0.2.1.tgz";
        sha1 = "2c637fe77c893afd2a663fe21aa9080068e2052a";
      };
    }
    {
      name = "resolve___resolve_1.1.7.tgz";
      path = fetchurl {
        name = "resolve___resolve_1.1.7.tgz";
        url  = "https://registry.yarnpkg.com/resolve/-/resolve-1.1.7.tgz";
        sha1 = "203114d82ad2c5ed9e8e0411b3932875e889e97b";
      };
    }
    {
      name = "resolve___resolve_1.17.0.tgz";
      path = fetchurl {
        name = "resolve___resolve_1.17.0.tgz";
        url  = "https://registry.yarnpkg.com/resolve/-/resolve-1.17.0.tgz";
        sha1 = "b25941b54968231cc2d1bb76a79cb7f2c0bf8444";
      };
    }
    {
      name = "restore_cursor___restore_cursor_2.0.0.tgz";
      path = fetchurl {
        name = "restore_cursor___restore_cursor_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/restore-cursor/-/restore-cursor-2.0.0.tgz";
        sha1 = "9f7ee287f82fd326d4fd162923d62129eee0dfaf";
      };
    }
    {
      name = "ret___ret_0.1.15.tgz";
      path = fetchurl {
        name = "ret___ret_0.1.15.tgz";
        url  = "https://registry.yarnpkg.com/ret/-/ret-0.1.15.tgz";
        sha1 = "b8a4825d5bdb1fc3f6f53c2bc33f81388681c7bc";
      };
    }
    {
      name = "reusify___reusify_1.0.4.tgz";
      path = fetchurl {
        name = "reusify___reusify_1.0.4.tgz";
        url  = "https://registry.yarnpkg.com/reusify/-/reusify-1.0.4.tgz";
        sha1 = "90da382b1e126efc02146e90845a88db12925d76";
      };
    }
    {
      name = "rgb_regex___rgb_regex_1.0.1.tgz";
      path = fetchurl {
        name = "rgb_regex___rgb_regex_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/rgb-regex/-/rgb-regex-1.0.1.tgz";
        sha1 = "c0e0d6882df0e23be254a475e8edd41915feaeb1";
      };
    }
    {
      name = "rgba_regex___rgba_regex_1.0.0.tgz";
      path = fetchurl {
        name = "rgba_regex___rgba_regex_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/rgba-regex/-/rgba-regex-1.0.0.tgz";
        sha1 = "43374e2e2ca0968b0ef1523460b7d730ff22eeb3";
      };
    }
    {
      name = "rimraf___rimraf_2.7.1.tgz";
      path = fetchurl {
        name = "rimraf___rimraf_2.7.1.tgz";
        url  = "https://registry.yarnpkg.com/rimraf/-/rimraf-2.7.1.tgz";
        sha1 = "35797f13a7fdadc566142c29d4f07ccad483e3ec";
      };
    }
    {
      name = "rimraf___rimraf_3.0.2.tgz";
      path = fetchurl {
        name = "rimraf___rimraf_3.0.2.tgz";
        url  = "https://registry.yarnpkg.com/rimraf/-/rimraf-3.0.2.tgz";
        sha1 = "f1a5402ba6220ad52cc1282bac1ae3aa49fd061a";
      };
    }
    {
      name = "ripemd160___ripemd160_2.0.2.tgz";
      path = fetchurl {
        name = "ripemd160___ripemd160_2.0.2.tgz";
        url  = "https://registry.yarnpkg.com/ripemd160/-/ripemd160-2.0.2.tgz";
        sha1 = "a1c1a6f624751577ba5d07914cbc92850585890c";
      };
    }
    {
      name = "rmc_feedback___rmc_feedback_2.0.0.tgz";
      path = fetchurl {
        name = "rmc_feedback___rmc_feedback_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/rmc-feedback/-/rmc-feedback-2.0.0.tgz";
        sha1 = "cbc6cb3ae63c7a635eef0e25e4fbaf5ac366eeaa";
      };
    }
    {
      name = "rsvp___rsvp_4.8.5.tgz";
      path = fetchurl {
        name = "rsvp___rsvp_4.8.5.tgz";
        url  = "https://registry.yarnpkg.com/rsvp/-/rsvp-4.8.5.tgz";
        sha1 = "c8f155311d167f68f21e168df71ec5b083113734";
      };
    }
    {
      name = "rtl_css_js___rtl_css_js_1.14.0.tgz";
      path = fetchurl {
        name = "rtl_css_js___rtl_css_js_1.14.0.tgz";
        url  = "https://registry.yarnpkg.com/rtl-css-js/-/rtl-css-js-1.14.0.tgz";
        sha1 = "daa4f192a92509e292a0519f4b255e6e3c076b7d";
      };
    }
    {
      name = "run_parallel___run_parallel_1.1.9.tgz";
      path = fetchurl {
        name = "run_parallel___run_parallel_1.1.9.tgz";
        url  = "https://registry.yarnpkg.com/run-parallel/-/run-parallel-1.1.9.tgz";
        sha1 = "c9dd3a7cf9f4b2c4b6244e173a6ed866e61dd679";
      };
    }
    {
      name = "rw___rw_1.3.3.tgz";
      path = fetchurl {
        name = "rw___rw_1.3.3.tgz";
        url  = "https://registry.yarnpkg.com/rw/-/rw-1.3.3.tgz";
        sha1 = "3f862dfa91ab766b14885ef4d01124bfda074fb4";
      };
    }
    {
      name = "safe_buffer___safe_buffer_5.2.0.tgz";
      path = fetchurl {
        name = "safe_buffer___safe_buffer_5.2.0.tgz";
        url  = "https://registry.yarnpkg.com/safe-buffer/-/safe-buffer-5.2.0.tgz";
        sha1 = "b74daec49b1148f88c64b68d49b1e815c1f2f519";
      };
    }
    {
      name = "safe_buffer___safe_buffer_5.1.2.tgz";
      path = fetchurl {
        name = "safe_buffer___safe_buffer_5.1.2.tgz";
        url  = "https://registry.yarnpkg.com/safe-buffer/-/safe-buffer-5.1.2.tgz";
        sha1 = "991ec69d296e0313747d59bdfd2b745c35f8828d";
      };
    }
    {
      name = "safe_regex___safe_regex_1.1.0.tgz";
      path = fetchurl {
        name = "safe_regex___safe_regex_1.1.0.tgz";
        url  = "https://registry.yarnpkg.com/safe-regex/-/safe-regex-1.1.0.tgz";
        sha1 = "40a3669f3b077d1e943d44629e157dd48023bf2e";
      };
    }
    {
      name = "safer_buffer___safer_buffer_2.1.2.tgz";
      path = fetchurl {
        name = "safer_buffer___safer_buffer_2.1.2.tgz";
        url  = "https://registry.yarnpkg.com/safer-buffer/-/safer-buffer-2.1.2.tgz";
        sha1 = "44fa161b0187b9549dd84bb91802f9bd8385cd6a";
      };
    }
    {
      name = "safer_eval___safer_eval_1.3.6.tgz";
      path = fetchurl {
        name = "safer_eval___safer_eval_1.3.6.tgz";
        url  = "https://registry.yarnpkg.com/safer-eval/-/safer-eval-1.3.6.tgz";
        sha1 = "ee51e3348c39fdc4117a47dfb4b69df56a2e40cf";
      };
    }
    {
      name = "sane___sane_4.1.0.tgz";
      path = fetchurl {
        name = "sane___sane_4.1.0.tgz";
        url  = "https://registry.yarnpkg.com/sane/-/sane-4.1.0.tgz";
        sha1 = "ed881fd922733a6c461bc189dc2b6c006f3ffded";
      };
    }
    {
      name = "sax___sax_1.2.4.tgz";
      path = fetchurl {
        name = "sax___sax_1.2.4.tgz";
        url  = "https://registry.yarnpkg.com/sax/-/sax-1.2.4.tgz";
        sha1 = "2816234e2378bddc4e5354fab5caa895df7100d9";
      };
    }
    {
      name = "saxes___saxes_3.1.11.tgz";
      path = fetchurl {
        name = "saxes___saxes_3.1.11.tgz";
        url  = "https://registry.yarnpkg.com/saxes/-/saxes-3.1.11.tgz";
        sha1 = "d59d1fd332ec92ad98a2e0b2ee644702384b1c5b";
      };
    }
    {
      name = "scheduler___scheduler_0.18.0.tgz";
      path = fetchurl {
        name = "scheduler___scheduler_0.18.0.tgz";
        url  = "https://registry.yarnpkg.com/scheduler/-/scheduler-0.18.0.tgz";
        sha1 = "5901ad6659bc1d8f3fdaf36eb7a67b0d6746b1c4";
      };
    }
    {
      name = "scheduler___scheduler_0.19.1.tgz";
      path = fetchurl {
        name = "scheduler___scheduler_0.19.1.tgz";
        url  = "https://registry.yarnpkg.com/scheduler/-/scheduler-0.19.1.tgz";
        sha1 = "4f3e2ed2c1a7d65681f4c854fa8c5a1ccb40f196";
      };
    }
    {
      name = "screenfull___screenfull_5.0.2.tgz";
      path = fetchurl {
        name = "screenfull___screenfull_5.0.2.tgz";
        url  = "https://registry.yarnpkg.com/screenfull/-/screenfull-5.0.2.tgz";
        sha1 = "b9acdcf1ec676a948674df5cd0ff66b902b0bed7";
      };
    }
    {
      name = "scroll_into_view_if_needed___scroll_into_view_if_needed_2.2.24.tgz";
      path = fetchurl {
        name = "scroll_into_view_if_needed___scroll_into_view_if_needed_2.2.24.tgz";
        url  = "https://registry.yarnpkg.com/scroll-into-view-if-needed/-/scroll-into-view-if-needed-2.2.24.tgz";
        sha1 = "12bca532990769bd509115a49edcfa755e92a0ea";
      };
    }
    {
      name = "seed_random___seed_random_2.2.0.tgz";
      path = fetchurl {
        name = "seed_random___seed_random_2.2.0.tgz";
        url  = "https://registry.yarnpkg.com/seed-random/-/seed-random-2.2.0.tgz";
        sha1 = "2a9b19e250a817099231a5b99a4daf80b7fbed54";
      };
    }
    {
      name = "semver___semver_5.7.1.tgz";
      path = fetchurl {
        name = "semver___semver_5.7.1.tgz";
        url  = "https://registry.yarnpkg.com/semver/-/semver-5.7.1.tgz";
        sha1 = "a954f931aeba508d307bbf069eff0c01c96116f7";
      };
    }
    {
      name = "semver___semver_7.0.0.tgz";
      path = fetchurl {
        name = "semver___semver_7.0.0.tgz";
        url  = "https://registry.yarnpkg.com/semver/-/semver-7.0.0.tgz";
        sha1 = "5f3ca35761e47e05b206c6daff2cf814f0316b8e";
      };
    }
    {
      name = "semver___semver_6.3.0.tgz";
      path = fetchurl {
        name = "semver___semver_6.3.0.tgz";
        url  = "https://registry.yarnpkg.com/semver/-/semver-6.3.0.tgz";
        sha1 = "ee0a64c8af5e8ceea67687b133761e1becbd1d3d";
      };
    }
    {
      name = "semver___semver_7.3.2.tgz";
      path = fetchurl {
        name = "semver___semver_7.3.2.tgz";
        url  = "https://registry.yarnpkg.com/semver/-/semver-7.3.2.tgz";
        sha1 = "604962b052b81ed0786aae84389ffba70ffd3938";
      };
    }
    {
      name = "send___send_0.17.1.tgz";
      path = fetchurl {
        name = "send___send_0.17.1.tgz";
        url  = "https://registry.yarnpkg.com/send/-/send-0.17.1.tgz";
        sha1 = "c1d8b059f7900f7466dd4938bdc44e11ddb376c8";
      };
    }
    {
      name = "serialize_to_js___serialize_to_js_1.2.2.tgz";
      path = fetchurl {
        name = "serialize_to_js___serialize_to_js_1.2.2.tgz";
        url  = "https://registry.yarnpkg.com/serialize-to-js/-/serialize-to-js-1.2.2.tgz";
        sha1 = "1a567b0c9bf557bc7d7b77b503dfae0a8218d15d";
      };
    }
    {
      name = "serialize_to_js___serialize_to_js_3.1.1.tgz";
      path = fetchurl {
        name = "serialize_to_js___serialize_to_js_3.1.1.tgz";
        url  = "https://registry.yarnpkg.com/serialize-to-js/-/serialize-to-js-3.1.1.tgz";
        sha1 = "b3e77d0568ee4a60bfe66287f991e104d3a1a4ac";
      };
    }
    {
      name = "serve_static___serve_static_1.14.1.tgz";
      path = fetchurl {
        name = "serve_static___serve_static_1.14.1.tgz";
        url  = "https://registry.yarnpkg.com/serve-static/-/serve-static-1.14.1.tgz";
        sha1 = "666e636dc4f010f7ef29970a88a674320898b2f9";
      };
    }
    {
      name = "set_blocking___set_blocking_2.0.0.tgz";
      path = fetchurl {
        name = "set_blocking___set_blocking_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/set-blocking/-/set-blocking-2.0.0.tgz";
        sha1 = "045f9782d011ae9a6803ddd382b24392b3d890f7";
      };
    }
    {
      name = "set_harmonic_interval___set_harmonic_interval_1.0.1.tgz";
      path = fetchurl {
        name = "set_harmonic_interval___set_harmonic_interval_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/set-harmonic-interval/-/set-harmonic-interval-1.0.1.tgz";
        sha1 = "e1773705539cdfb80ce1c3d99e7f298bb3995249";
      };
    }
    {
      name = "set_value___set_value_2.0.1.tgz";
      path = fetchurl {
        name = "set_value___set_value_2.0.1.tgz";
        url  = "https://registry.yarnpkg.com/set-value/-/set-value-2.0.1.tgz";
        sha1 = "a18d40530e6f07de4228c7defe4227af8cad005b";
      };
    }
    {
      name = "setimmediate___setimmediate_1.0.5.tgz";
      path = fetchurl {
        name = "setimmediate___setimmediate_1.0.5.tgz";
        url  = "https://registry.yarnpkg.com/setimmediate/-/setimmediate-1.0.5.tgz";
        sha1 = "290cbb232e306942d7d7ea9b83732ab7856f8285";
      };
    }
    {
      name = "setprototypeof___setprototypeof_1.1.1.tgz";
      path = fetchurl {
        name = "setprototypeof___setprototypeof_1.1.1.tgz";
        url  = "https://registry.yarnpkg.com/setprototypeof/-/setprototypeof-1.1.1.tgz";
        sha1 = "7e95acb24aa92f5885e0abef5ba131330d4ae683";
      };
    }
    {
      name = "sha.js___sha.js_2.4.11.tgz";
      path = fetchurl {
        name = "sha.js___sha.js_2.4.11.tgz";
        url  = "https://registry.yarnpkg.com/sha.js/-/sha.js-2.4.11.tgz";
        sha1 = "37a5cf0b81ecbc6943de109ba2960d1b26584ae7";
      };
    }
    {
      name = "shallow_copy___shallow_copy_0.0.1.tgz";
      path = fetchurl {
        name = "shallow_copy___shallow_copy_0.0.1.tgz";
        url  = "https://registry.yarnpkg.com/shallow-copy/-/shallow-copy-0.0.1.tgz";
        sha1 = "415f42702d73d810330292cc5ee86eae1a11a170";
      };
    }
    {
      name = "shallow_equal___shallow_equal_1.2.1.tgz";
      path = fetchurl {
        name = "shallow_equal___shallow_equal_1.2.1.tgz";
        url  = "https://registry.yarnpkg.com/shallow-equal/-/shallow-equal-1.2.1.tgz";
        sha1 = "4c16abfa56043aa20d050324efa68940b0da79da";
      };
    }
    {
      name = "shallowequal___shallowequal_1.1.0.tgz";
      path = fetchurl {
        name = "shallowequal___shallowequal_1.1.0.tgz";
        url  = "https://registry.yarnpkg.com/shallowequal/-/shallowequal-1.1.0.tgz";
        sha1 = "188d521de95b9087404fd4dcb68b13df0ae4e7f8";
      };
    }
    {
      name = "shebang_command___shebang_command_1.2.0.tgz";
      path = fetchurl {
        name = "shebang_command___shebang_command_1.2.0.tgz";
        url  = "https://registry.yarnpkg.com/shebang-command/-/shebang-command-1.2.0.tgz";
        sha1 = "44aac65b695b03398968c39f363fee5deafdf1ea";
      };
    }
    {
      name = "shebang_command___shebang_command_2.0.0.tgz";
      path = fetchurl {
        name = "shebang_command___shebang_command_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/shebang-command/-/shebang-command-2.0.0.tgz";
        sha1 = "ccd0af4f8835fbdc265b82461aaf0c36663f34ea";
      };
    }
    {
      name = "shebang_regex___shebang_regex_1.0.0.tgz";
      path = fetchurl {
        name = "shebang_regex___shebang_regex_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/shebang-regex/-/shebang-regex-1.0.0.tgz";
        sha1 = "da42f49740c0b42db2ca9728571cb190c98efea3";
      };
    }
    {
      name = "shebang_regex___shebang_regex_3.0.0.tgz";
      path = fetchurl {
        name = "shebang_regex___shebang_regex_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/shebang-regex/-/shebang-regex-3.0.0.tgz";
        sha1 = "ae16f1644d873ecad843b0307b143362d4c42172";
      };
    }
    {
      name = "shellwords___shellwords_0.1.1.tgz";
      path = fetchurl {
        name = "shellwords___shellwords_0.1.1.tgz";
        url  = "https://registry.yarnpkg.com/shellwords/-/shellwords-0.1.1.tgz";
        sha1 = "d6b9181c1a48d397324c84871efbcfc73fc0654b";
      };
    }
    {
      name = "sigmund___sigmund_1.0.1.tgz";
      path = fetchurl {
        name = "sigmund___sigmund_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/sigmund/-/sigmund-1.0.1.tgz";
        sha1 = "3ff21f198cad2175f9f3b781853fd94d0d19b590";
      };
    }
    {
      name = "signal_exit___signal_exit_3.0.3.tgz";
      path = fetchurl {
        name = "signal_exit___signal_exit_3.0.3.tgz";
        url  = "https://registry.yarnpkg.com/signal-exit/-/signal-exit-3.0.3.tgz";
        sha1 = "a1410c2edd8f077b08b4e253c8eacfcaf057461c";
      };
    }
    {
      name = "simple_swizzle___simple_swizzle_0.2.2.tgz";
      path = fetchurl {
        name = "simple_swizzle___simple_swizzle_0.2.2.tgz";
        url  = "https://registry.yarnpkg.com/simple-swizzle/-/simple-swizzle-0.2.2.tgz";
        sha1 = "a4da6b635ffcccca33f70d17cb92592de95e557a";
      };
    }
    {
      name = "sisteransi___sisteransi_1.0.5.tgz";
      path = fetchurl {
        name = "sisteransi___sisteransi_1.0.5.tgz";
        url  = "https://registry.yarnpkg.com/sisteransi/-/sisteransi-1.0.5.tgz";
        sha1 = "134d681297756437cc05ca01370d3a7a571075ed";
      };
    }
    {
      name = "slash___slash_3.0.0.tgz";
      path = fetchurl {
        name = "slash___slash_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/slash/-/slash-3.0.0.tgz";
        sha1 = "6539be870c165adbd5240220dbe361f1bc4d4634";
      };
    }
    {
      name = "snapdragon_node___snapdragon_node_2.1.1.tgz";
      path = fetchurl {
        name = "snapdragon_node___snapdragon_node_2.1.1.tgz";
        url  = "https://registry.yarnpkg.com/snapdragon-node/-/snapdragon-node-2.1.1.tgz";
        sha1 = "6c175f86ff14bdb0724563e8f3c1b021a286853b";
      };
    }
    {
      name = "snapdragon_util___snapdragon_util_3.0.1.tgz";
      path = fetchurl {
        name = "snapdragon_util___snapdragon_util_3.0.1.tgz";
        url  = "https://registry.yarnpkg.com/snapdragon-util/-/snapdragon-util-3.0.1.tgz";
        sha1 = "f956479486f2acd79700693f6f7b805e45ab56e2";
      };
    }
    {
      name = "snapdragon___snapdragon_0.8.2.tgz";
      path = fetchurl {
        name = "snapdragon___snapdragon_0.8.2.tgz";
        url  = "https://registry.yarnpkg.com/snapdragon/-/snapdragon-0.8.2.tgz";
        sha1 = "64922e7c565b0e14204ba1aa7d6964278d25182d";
      };
    }
    {
      name = "sort_keys___sort_keys_1.1.2.tgz";
      path = fetchurl {
        name = "sort_keys___sort_keys_1.1.2.tgz";
        url  = "https://registry.yarnpkg.com/sort-keys/-/sort-keys-1.1.2.tgz";
        sha1 = "441b6d4d346798f1b4e49e8920adfba0e543f9ad";
      };
    }
    {
      name = "source_map_resolve___source_map_resolve_0.5.3.tgz";
      path = fetchurl {
        name = "source_map_resolve___source_map_resolve_0.5.3.tgz";
        url  = "https://registry.yarnpkg.com/source-map-resolve/-/source-map-resolve-0.5.3.tgz";
        sha1 = "190866bece7553e1f8f267a2ee82c606b5509a1a";
      };
    }
    {
      name = "source_map_support___source_map_support_0.5.19.tgz";
      path = fetchurl {
        name = "source_map_support___source_map_support_0.5.19.tgz";
        url  = "https://registry.yarnpkg.com/source-map-support/-/source-map-support-0.5.19.tgz";
        sha1 = "a98b62f86dcaf4f67399648c085291ab9e8fed61";
      };
    }
    {
      name = "source_map_url___source_map_url_0.4.0.tgz";
      path = fetchurl {
        name = "source_map_url___source_map_url_0.4.0.tgz";
        url  = "https://registry.yarnpkg.com/source-map-url/-/source-map-url-0.4.0.tgz";
        sha1 = "3e935d7ddd73631b97659956d55128e87b5084a3";
      };
    }
    {
      name = "source_map___source_map_0.5.6.tgz";
      path = fetchurl {
        name = "source_map___source_map_0.5.6.tgz";
        url  = "https://registry.yarnpkg.com/source-map/-/source-map-0.5.6.tgz";
        sha1 = "75ce38f52bf0733c5a7f0c118d81334a2bb5f412";
      };
    }
    {
      name = "source_map___source_map_0.6.1.tgz";
      path = fetchurl {
        name = "source_map___source_map_0.6.1.tgz";
        url  = "https://registry.yarnpkg.com/source-map/-/source-map-0.6.1.tgz";
        sha1 = "74722af32e9614e9c287a8d0bbde48b5e2f1a263";
      };
    }
    {
      name = "source_map___source_map_0.5.7.tgz";
      path = fetchurl {
        name = "source_map___source_map_0.5.7.tgz";
        url  = "https://registry.yarnpkg.com/source-map/-/source-map-0.5.7.tgz";
        sha1 = "8a039d2d1021d22d1ea14c80d8ea468ba2ef3fcc";
      };
    }
    {
      name = "source_map___source_map_0.7.3.tgz";
      path = fetchurl {
        name = "source_map___source_map_0.7.3.tgz";
        url  = "https://registry.yarnpkg.com/source-map/-/source-map-0.7.3.tgz";
        sha1 = "5302f8169031735226544092e64981f751750383";
      };
    }
    {
      name = "sourcemap_codec___sourcemap_codec_1.4.8.tgz";
      path = fetchurl {
        name = "sourcemap_codec___sourcemap_codec_1.4.8.tgz";
        url  = "https://registry.yarnpkg.com/sourcemap-codec/-/sourcemap-codec-1.4.8.tgz";
        sha1 = "ea804bd94857402e6992d05a38ef1ae35a9ab4c4";
      };
    }
    {
      name = "spdx_correct___spdx_correct_3.1.0.tgz";
      path = fetchurl {
        name = "spdx_correct___spdx_correct_3.1.0.tgz";
        url  = "https://registry.yarnpkg.com/spdx-correct/-/spdx-correct-3.1.0.tgz";
        sha1 = "fb83e504445268f154b074e218c87c003cd31df4";
      };
    }
    {
      name = "spdx_exceptions___spdx_exceptions_2.3.0.tgz";
      path = fetchurl {
        name = "spdx_exceptions___spdx_exceptions_2.3.0.tgz";
        url  = "https://registry.yarnpkg.com/spdx-exceptions/-/spdx-exceptions-2.3.0.tgz";
        sha1 = "3f28ce1a77a00372683eade4a433183527a2163d";
      };
    }
    {
      name = "spdx_expression_parse___spdx_expression_parse_3.0.0.tgz";
      path = fetchurl {
        name = "spdx_expression_parse___spdx_expression_parse_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/spdx-expression-parse/-/spdx-expression-parse-3.0.0.tgz";
        sha1 = "99e119b7a5da00e05491c9fa338b7904823b41d0";
      };
    }
    {
      name = "spdx_license_ids___spdx_license_ids_3.0.5.tgz";
      path = fetchurl {
        name = "spdx_license_ids___spdx_license_ids_3.0.5.tgz";
        url  = "https://registry.yarnpkg.com/spdx-license-ids/-/spdx-license-ids-3.0.5.tgz";
        sha1 = "3694b5804567a458d3c8045842a6358632f62654";
      };
    }
    {
      name = "split_string___split_string_3.1.0.tgz";
      path = fetchurl {
        name = "split_string___split_string_3.1.0.tgz";
        url  = "https://registry.yarnpkg.com/split-string/-/split-string-3.1.0.tgz";
        sha1 = "7cb09dda3a86585705c64b39a6466038682e8fe2";
      };
    }
    {
      name = "sprintf_js___sprintf_js_1.0.3.tgz";
      path = fetchurl {
        name = "sprintf_js___sprintf_js_1.0.3.tgz";
        url  = "https://registry.yarnpkg.com/sprintf-js/-/sprintf-js-1.0.3.tgz";
        sha1 = "04e6926f662895354f3dd015203633b857297e2c";
      };
    }
    {
      name = "sshpk___sshpk_1.16.1.tgz";
      path = fetchurl {
        name = "sshpk___sshpk_1.16.1.tgz";
        url  = "https://registry.yarnpkg.com/sshpk/-/sshpk-1.16.1.tgz";
        sha1 = "fb661c0bef29b39db40769ee39fa70093d6f6877";
      };
    }
    {
      name = "stable___stable_0.1.8.tgz";
      path = fetchurl {
        name = "stable___stable_0.1.8.tgz";
        url  = "https://registry.yarnpkg.com/stable/-/stable-0.1.8.tgz";
        sha1 = "836eb3c8382fe2936feaf544631017ce7d47a3cf";
      };
    }
    {
      name = "stack_generator___stack_generator_2.0.5.tgz";
      path = fetchurl {
        name = "stack_generator___stack_generator_2.0.5.tgz";
        url  = "https://registry.yarnpkg.com/stack-generator/-/stack-generator-2.0.5.tgz";
        sha1 = "fb00e5b4ee97de603e0773ea78ce944d81596c36";
      };
    }
    {
      name = "stack_utils___stack_utils_1.0.2.tgz";
      path = fetchurl {
        name = "stack_utils___stack_utils_1.0.2.tgz";
        url  = "https://registry.yarnpkg.com/stack-utils/-/stack-utils-1.0.2.tgz";
        sha1 = "33eba3897788558bebfc2db059dc158ec36cebb8";
      };
    }
    {
      name = "stackframe___stackframe_1.1.1.tgz";
      path = fetchurl {
        name = "stackframe___stackframe_1.1.1.tgz";
        url  = "https://registry.yarnpkg.com/stackframe/-/stackframe-1.1.1.tgz";
        sha1 = "ffef0a3318b1b60c3b58564989aca5660729ec71";
      };
    }
    {
      name = "stacktrace_gps___stacktrace_gps_3.0.4.tgz";
      path = fetchurl {
        name = "stacktrace_gps___stacktrace_gps_3.0.4.tgz";
        url  = "https://registry.yarnpkg.com/stacktrace-gps/-/stacktrace-gps-3.0.4.tgz";
        sha1 = "7688dc2fc09ffb3a13165ebe0dbcaf41bcf0c69a";
      };
    }
    {
      name = "stacktrace_js___stacktrace_js_2.0.2.tgz";
      path = fetchurl {
        name = "stacktrace_js___stacktrace_js_2.0.2.tgz";
        url  = "https://registry.yarnpkg.com/stacktrace-js/-/stacktrace-js-2.0.2.tgz";
        sha1 = "4ca93ea9f494752d55709a081d400fdaebee897b";
      };
    }
    {
      name = "static_eval___static_eval_2.0.5.tgz";
      path = fetchurl {
        name = "static_eval___static_eval_2.0.5.tgz";
        url  = "https://registry.yarnpkg.com/static-eval/-/static-eval-2.0.5.tgz";
        sha1 = "f0782e66999c4b3651cda99d9ce59c507d188f71";
      };
    }
    {
      name = "static_extend___static_extend_0.1.2.tgz";
      path = fetchurl {
        name = "static_extend___static_extend_0.1.2.tgz";
        url  = "https://registry.yarnpkg.com/static-extend/-/static-extend-0.1.2.tgz";
        sha1 = "60809c39cbff55337226fd5e0b520f341f1fb5c6";
      };
    }
    {
      name = "static_module___static_module_2.2.5.tgz";
      path = fetchurl {
        name = "static_module___static_module_2.2.5.tgz";
        url  = "https://registry.yarnpkg.com/static-module/-/static-module-2.2.5.tgz";
        sha1 = "bd40abceae33da6b7afb84a0e4329ff8852bfbbf";
      };
    }
    {
      name = "statuses___statuses_1.5.0.tgz";
      path = fetchurl {
        name = "statuses___statuses_1.5.0.tgz";
        url  = "https://registry.yarnpkg.com/statuses/-/statuses-1.5.0.tgz";
        sha1 = "161c7dac177659fd9811f43771fa99381478628c";
      };
    }
    {
      name = "stealthy_require___stealthy_require_1.1.1.tgz";
      path = fetchurl {
        name = "stealthy_require___stealthy_require_1.1.1.tgz";
        url  = "https://registry.yarnpkg.com/stealthy-require/-/stealthy-require-1.1.1.tgz";
        sha1 = "35b09875b4ff49f26a777e509b3090a3226bf24b";
      };
    }
    {
      name = "stream_browserify___stream_browserify_2.0.2.tgz";
      path = fetchurl {
        name = "stream_browserify___stream_browserify_2.0.2.tgz";
        url  = "https://registry.yarnpkg.com/stream-browserify/-/stream-browserify-2.0.2.tgz";
        sha1 = "87521d38a44aa7ee91ce1cd2a47df0cb49dd660b";
      };
    }
    {
      name = "stream_http___stream_http_2.8.3.tgz";
      path = fetchurl {
        name = "stream_http___stream_http_2.8.3.tgz";
        url  = "https://registry.yarnpkg.com/stream-http/-/stream-http-2.8.3.tgz";
        sha1 = "b2d242469288a5a27ec4fe8933acf623de6514fc";
      };
    }
    {
      name = "strict_uri_encode___strict_uri_encode_1.1.0.tgz";
      path = fetchurl {
        name = "strict_uri_encode___strict_uri_encode_1.1.0.tgz";
        url  = "https://registry.yarnpkg.com/strict-uri-encode/-/strict-uri-encode-1.1.0.tgz";
        sha1 = "279b225df1d582b1f54e65addd4352e18faa0713";
      };
    }
    {
      name = "string_convert___string_convert_0.2.1.tgz";
      path = fetchurl {
        name = "string_convert___string_convert_0.2.1.tgz";
        url  = "https://registry.yarnpkg.com/string-convert/-/string-convert-0.2.1.tgz";
        sha1 = "6982cc3049fbb4cd85f8b24568b9d9bf39eeff97";
      };
    }
    {
      name = "string_length___string_length_3.1.0.tgz";
      path = fetchurl {
        name = "string_length___string_length_3.1.0.tgz";
        url  = "https://registry.yarnpkg.com/string-length/-/string-length-3.1.0.tgz";
        sha1 = "107ef8c23456e187a8abd4a61162ff4ac6e25837";
      };
    }
    {
      name = "string_width___string_width_1.0.2.tgz";
      path = fetchurl {
        name = "string_width___string_width_1.0.2.tgz";
        url  = "https://registry.yarnpkg.com/string-width/-/string-width-1.0.2.tgz";
        sha1 = "118bdf5b8cdc51a2a7e70d211e07e2b0b9b107d3";
      };
    }
    {
      name = "string_width___string_width_2.1.1.tgz";
      path = fetchurl {
        name = "string_width___string_width_2.1.1.tgz";
        url  = "https://registry.yarnpkg.com/string-width/-/string-width-2.1.1.tgz";
        sha1 = "ab93f27a8dc13d28cac815c462143a6d9012ae9e";
      };
    }
    {
      name = "string_width___string_width_3.1.0.tgz";
      path = fetchurl {
        name = "string_width___string_width_3.1.0.tgz";
        url  = "https://registry.yarnpkg.com/string-width/-/string-width-3.1.0.tgz";
        sha1 = "22767be21b62af1081574306f69ac51b62203961";
      };
    }
    {
      name = "string_width___string_width_4.2.0.tgz";
      path = fetchurl {
        name = "string_width___string_width_4.2.0.tgz";
        url  = "https://registry.yarnpkg.com/string-width/-/string-width-4.2.0.tgz";
        sha1 = "952182c46cc7b2c313d1596e623992bd163b72b5";
      };
    }
    {
      name = "string.prototype.trimend___string.prototype.trimend_1.0.1.tgz";
      path = fetchurl {
        name = "string.prototype.trimend___string.prototype.trimend_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/string.prototype.trimend/-/string.prototype.trimend-1.0.1.tgz";
        sha1 = "85812a6b847ac002270f5808146064c995fb6913";
      };
    }
    {
      name = "string.prototype.trimleft___string.prototype.trimleft_2.1.2.tgz";
      path = fetchurl {
        name = "string.prototype.trimleft___string.prototype.trimleft_2.1.2.tgz";
        url  = "https://registry.yarnpkg.com/string.prototype.trimleft/-/string.prototype.trimleft-2.1.2.tgz";
        sha1 = "4408aa2e5d6ddd0c9a80739b087fbc067c03b3cc";
      };
    }
    {
      name = "string.prototype.trimright___string.prototype.trimright_2.1.2.tgz";
      path = fetchurl {
        name = "string.prototype.trimright___string.prototype.trimright_2.1.2.tgz";
        url  = "https://registry.yarnpkg.com/string.prototype.trimright/-/string.prototype.trimright-2.1.2.tgz";
        sha1 = "c76f1cef30f21bbad8afeb8db1511496cfb0f2a3";
      };
    }
    {
      name = "string.prototype.trimstart___string.prototype.trimstart_1.0.1.tgz";
      path = fetchurl {
        name = "string.prototype.trimstart___string.prototype.trimstart_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/string.prototype.trimstart/-/string.prototype.trimstart-1.0.1.tgz";
        sha1 = "14af6d9f34b053f7cfc89b72f8f2ee14b9039a54";
      };
    }
    {
      name = "string_decoder___string_decoder_1.3.0.tgz";
      path = fetchurl {
        name = "string_decoder___string_decoder_1.3.0.tgz";
        url  = "https://registry.yarnpkg.com/string_decoder/-/string_decoder-1.3.0.tgz";
        sha1 = "42f114594a46cf1a8e30b0a84f56c78c3edac21e";
      };
    }
    {
      name = "string_decoder___string_decoder_1.1.1.tgz";
      path = fetchurl {
        name = "string_decoder___string_decoder_1.1.1.tgz";
        url  = "https://registry.yarnpkg.com/string_decoder/-/string_decoder-1.1.1.tgz";
        sha1 = "9cf1611ba62685d7030ae9e4ba34149c3af03fc8";
      };
    }
    {
      name = "strip_ansi___strip_ansi_3.0.1.tgz";
      path = fetchurl {
        name = "strip_ansi___strip_ansi_3.0.1.tgz";
        url  = "https://registry.yarnpkg.com/strip-ansi/-/strip-ansi-3.0.1.tgz";
        sha1 = "6a385fb8853d952d5ff05d0e8aaf94278dc63dcf";
      };
    }
    {
      name = "strip_ansi___strip_ansi_4.0.0.tgz";
      path = fetchurl {
        name = "strip_ansi___strip_ansi_4.0.0.tgz";
        url  = "https://registry.yarnpkg.com/strip-ansi/-/strip-ansi-4.0.0.tgz";
        sha1 = "a8479022eb1ac368a871389b635262c505ee368f";
      };
    }
    {
      name = "strip_ansi___strip_ansi_5.2.0.tgz";
      path = fetchurl {
        name = "strip_ansi___strip_ansi_5.2.0.tgz";
        url  = "https://registry.yarnpkg.com/strip-ansi/-/strip-ansi-5.2.0.tgz";
        sha1 = "8c9a536feb6afc962bdfa5b104a5091c1ad9c0ae";
      };
    }
    {
      name = "strip_ansi___strip_ansi_6.0.0.tgz";
      path = fetchurl {
        name = "strip_ansi___strip_ansi_6.0.0.tgz";
        url  = "https://registry.yarnpkg.com/strip-ansi/-/strip-ansi-6.0.0.tgz";
        sha1 = "0b1571dd7669ccd4f3e06e14ef1eed26225ae532";
      };
    }
    {
      name = "strip_bom___strip_bom_4.0.0.tgz";
      path = fetchurl {
        name = "strip_bom___strip_bom_4.0.0.tgz";
        url  = "https://registry.yarnpkg.com/strip-bom/-/strip-bom-4.0.0.tgz";
        sha1 = "9c3505c1db45bcedca3d9cf7a16f5c5aa3901878";
      };
    }
    {
      name = "strip_eof___strip_eof_1.0.0.tgz";
      path = fetchurl {
        name = "strip_eof___strip_eof_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/strip-eof/-/strip-eof-1.0.0.tgz";
        sha1 = "bb43ff5598a6eb05d89b59fcd129c983313606bf";
      };
    }
    {
      name = "strip_final_newline___strip_final_newline_2.0.0.tgz";
      path = fetchurl {
        name = "strip_final_newline___strip_final_newline_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/strip-final-newline/-/strip-final-newline-2.0.0.tgz";
        sha1 = "89b852fb2fcbe936f6f4b3187afb0a12c1ab58ad";
      };
    }
    {
      name = "strip_indent___strip_indent_3.0.0.tgz";
      path = fetchurl {
        name = "strip_indent___strip_indent_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/strip-indent/-/strip-indent-3.0.0.tgz";
        sha1 = "c32e1cee940b6b3432c771bc2c54bcce73cd3001";
      };
    }
    {
      name = "strip_outer___strip_outer_1.0.1.tgz";
      path = fetchurl {
        name = "strip_outer___strip_outer_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/strip-outer/-/strip-outer-1.0.1.tgz";
        sha1 = "b2fd2abf6604b9d1e6013057195df836b8a9d631";
      };
    }
    {
      name = "strip_url_auth___strip_url_auth_1.0.1.tgz";
      path = fetchurl {
        name = "strip_url_auth___strip_url_auth_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/strip-url-auth/-/strip-url-auth-1.0.1.tgz";
        sha1 = "22b0fa3a41385b33be3f331551bbb837fa0cd7ae";
      };
    }
    {
      name = "stylehacks___stylehacks_4.0.3.tgz";
      path = fetchurl {
        name = "stylehacks___stylehacks_4.0.3.tgz";
        url  = "https://registry.yarnpkg.com/stylehacks/-/stylehacks-4.0.3.tgz";
        sha1 = "6718fcaf4d1e07d8a1318690881e8d96726a71d5";
      };
    }
    {
      name = "stylis___stylis_3.5.0.tgz";
      path = fetchurl {
        name = "stylis___stylis_3.5.0.tgz";
        url  = "https://registry.yarnpkg.com/stylis/-/stylis-3.5.0.tgz";
        sha1 = "016fa239663d77f868fef5b67cf201c4b7c701e1";
      };
    }
    {
      name = "subscriptions_transport_ws___subscriptions_transport_ws_0.9.16.tgz";
      path = fetchurl {
        name = "subscriptions_transport_ws___subscriptions_transport_ws_0.9.16.tgz";
        url  = "https://registry.yarnpkg.com/subscriptions-transport-ws/-/subscriptions-transport-ws-0.9.16.tgz";
        sha1 = "90a422f0771d9c32069294c08608af2d47f596ec";
      };
    }
    {
      name = "supports_color___supports_color_2.0.0.tgz";
      path = fetchurl {
        name = "supports_color___supports_color_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/supports-color/-/supports-color-2.0.0.tgz";
        sha1 = "535d045ce6b6363fa40117084629995e9df324c7";
      };
    }
    {
      name = "supports_color___supports_color_3.2.3.tgz";
      path = fetchurl {
        name = "supports_color___supports_color_3.2.3.tgz";
        url  = "https://registry.yarnpkg.com/supports-color/-/supports-color-3.2.3.tgz";
        sha1 = "65ac0504b3954171d8a64946b2ae3cbb8a5f54f6";
      };
    }
    {
      name = "supports_color___supports_color_5.5.0.tgz";
      path = fetchurl {
        name = "supports_color___supports_color_5.5.0.tgz";
        url  = "https://registry.yarnpkg.com/supports-color/-/supports-color-5.5.0.tgz";
        sha1 = "e2e69a44ac8772f78a1ec0b35b689df6530efc8f";
      };
    }
    {
      name = "supports_color___supports_color_6.1.0.tgz";
      path = fetchurl {
        name = "supports_color___supports_color_6.1.0.tgz";
        url  = "https://registry.yarnpkg.com/supports-color/-/supports-color-6.1.0.tgz";
        sha1 = "0764abc69c63d5ac842dd4867e8d025e880df8f3";
      };
    }
    {
      name = "supports_color___supports_color_7.1.0.tgz";
      path = fetchurl {
        name = "supports_color___supports_color_7.1.0.tgz";
        url  = "https://registry.yarnpkg.com/supports-color/-/supports-color-7.1.0.tgz";
        sha1 = "68e32591df73e25ad1c4b49108a2ec507962bfd1";
      };
    }
    {
      name = "supports_hyperlinks___supports_hyperlinks_2.1.0.tgz";
      path = fetchurl {
        name = "supports_hyperlinks___supports_hyperlinks_2.1.0.tgz";
        url  = "https://registry.yarnpkg.com/supports-hyperlinks/-/supports-hyperlinks-2.1.0.tgz";
        sha1 = "f663df252af5f37c5d49bbd7eeefa9e0b9e59e47";
      };
    }
    {
      name = "svgo___svgo_1.3.2.tgz";
      path = fetchurl {
        name = "svgo___svgo_1.3.2.tgz";
        url  = "https://registry.yarnpkg.com/svgo/-/svgo-1.3.2.tgz";
        sha1 = "b6dc511c063346c9e415b81e43401145b96d4167";
      };
    }
    {
      name = "symbol_observable___symbol_observable_1.2.0.tgz";
      path = fetchurl {
        name = "symbol_observable___symbol_observable_1.2.0.tgz";
        url  = "https://registry.yarnpkg.com/symbol-observable/-/symbol-observable-1.2.0.tgz";
        sha1 = "c22688aed4eab3cdc2dfeacbb561660560a00804";
      };
    }
    {
      name = "symbol_tree___symbol_tree_3.2.4.tgz";
      path = fetchurl {
        name = "symbol_tree___symbol_tree_3.2.4.tgz";
        url  = "https://registry.yarnpkg.com/symbol-tree/-/symbol-tree-3.2.4.tgz";
        sha1 = "430637d248ba77e078883951fb9aa0eed7c63fa2";
      };
    }
    {
      name = "tailwindcss___tailwindcss_1.2.0.tgz";
      path = fetchurl {
        name = "tailwindcss___tailwindcss_1.2.0.tgz";
        url  = "https://registry.yarnpkg.com/tailwindcss/-/tailwindcss-1.2.0.tgz";
        sha1 = "5df317cebac4f3131f275d258a39da1ba3a0f291";
      };
    }
    {
      name = "terminal_link___terminal_link_2.1.1.tgz";
      path = fetchurl {
        name = "terminal_link___terminal_link_2.1.1.tgz";
        url  = "https://registry.yarnpkg.com/terminal-link/-/terminal-link-2.1.1.tgz";
        sha1 = "14a64a27ab3c0df933ea546fba55f2d078edc994";
      };
    }
    {
      name = "terser___terser_3.17.0.tgz";
      path = fetchurl {
        name = "terser___terser_3.17.0.tgz";
        url  = "https://registry.yarnpkg.com/terser/-/terser-3.17.0.tgz";
        sha1 = "f88ffbeda0deb5637f9d24b0da66f4e15ab10cb2";
      };
    }
    {
      name = "terser___terser_4.6.12.tgz";
      path = fetchurl {
        name = "terser___terser_4.6.12.tgz";
        url  = "https://registry.yarnpkg.com/terser/-/terser-4.6.12.tgz";
        sha1 = "44b98aef8703fdb09a3491bf79b43faffc5b4fee";
      };
    }
    {
      name = "test_exclude___test_exclude_6.0.0.tgz";
      path = fetchurl {
        name = "test_exclude___test_exclude_6.0.0.tgz";
        url  = "https://registry.yarnpkg.com/test-exclude/-/test-exclude-6.0.0.tgz";
        sha1 = "04a8698661d805ea6fa293b6cb9e63ac044ef15e";
      };
    }
    {
      name = "throat___throat_5.0.0.tgz";
      path = fetchurl {
        name = "throat___throat_5.0.0.tgz";
        url  = "https://registry.yarnpkg.com/throat/-/throat-5.0.0.tgz";
        sha1 = "c5199235803aad18754a667d659b5e72ce16764b";
      };
    }
    {
      name = "throttle_debounce___throttle_debounce_2.1.0.tgz";
      path = fetchurl {
        name = "throttle_debounce___throttle_debounce_2.1.0.tgz";
        url  = "https://registry.yarnpkg.com/throttle-debounce/-/throttle-debounce-2.1.0.tgz";
        sha1 = "257e648f0a56bd9e54fe0f132c4ab8611df4e1d5";
      };
    }
    {
      name = "through2___through2_2.0.5.tgz";
      path = fetchurl {
        name = "through2___through2_2.0.5.tgz";
        url  = "https://registry.yarnpkg.com/through2/-/through2-2.0.5.tgz";
        sha1 = "01c1e39eb31d07cb7d03a96a70823260b23132cd";
      };
    }
    {
      name = "timers_browserify___timers_browserify_2.0.11.tgz";
      path = fetchurl {
        name = "timers_browserify___timers_browserify_2.0.11.tgz";
        url  = "https://registry.yarnpkg.com/timers-browserify/-/timers-browserify-2.0.11.tgz";
        sha1 = "800b1f3eee272e5bc53ee465a04d0e804c31211f";
      };
    }
    {
      name = "timsort___timsort_0.3.0.tgz";
      path = fetchurl {
        name = "timsort___timsort_0.3.0.tgz";
        url  = "https://registry.yarnpkg.com/timsort/-/timsort-0.3.0.tgz";
        sha1 = "405411a8e7e6339fe64db9a234de11dc31e02bd4";
      };
    }
    {
      name = "tiny_emitter___tiny_emitter_2.1.0.tgz";
      path = fetchurl {
        name = "tiny_emitter___tiny_emitter_2.1.0.tgz";
        url  = "https://registry.yarnpkg.com/tiny-emitter/-/tiny-emitter-2.1.0.tgz";
        sha1 = "1d1a56edfc51c43e863cbb5382a72330e3555423";
      };
    }
    {
      name = "tiny_inflate___tiny_inflate_1.0.3.tgz";
      path = fetchurl {
        name = "tiny_inflate___tiny_inflate_1.0.3.tgz";
        url  = "https://registry.yarnpkg.com/tiny-inflate/-/tiny-inflate-1.0.3.tgz";
        sha1 = "122715494913a1805166aaf7c93467933eea26c4";
      };
    }
    {
      name = "tinycolor2___tinycolor2_1.4.1.tgz";
      path = fetchurl {
        name = "tinycolor2___tinycolor2_1.4.1.tgz";
        url  = "https://registry.yarnpkg.com/tinycolor2/-/tinycolor2-1.4.1.tgz";
        sha1 = "f4fad333447bc0b07d4dc8e9209d8f39a8ac77e8";
      };
    }
    {
      name = "tinydate___tinydate_1.3.0.tgz";
      path = fetchurl {
        name = "tinydate___tinydate_1.3.0.tgz";
        url  = "https://registry.yarnpkg.com/tinydate/-/tinydate-1.3.0.tgz";
        sha1 = "e6ca8e5a22b51bb4ea1c3a2a4fd1352dbd4c57fb";
      };
    }
    {
      name = "tmpl___tmpl_1.0.4.tgz";
      path = fetchurl {
        name = "tmpl___tmpl_1.0.4.tgz";
        url  = "https://registry.yarnpkg.com/tmpl/-/tmpl-1.0.4.tgz";
        sha1 = "23640dd7b42d00433911140820e5cf440e521dd1";
      };
    }
    {
      name = "to_arraybuffer___to_arraybuffer_1.0.1.tgz";
      path = fetchurl {
        name = "to_arraybuffer___to_arraybuffer_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/to-arraybuffer/-/to-arraybuffer-1.0.1.tgz";
        sha1 = "7d229b1fcc637e466ca081180836a7aabff83f43";
      };
    }
    {
      name = "to_fast_properties___to_fast_properties_1.0.3.tgz";
      path = fetchurl {
        name = "to_fast_properties___to_fast_properties_1.0.3.tgz";
        url  = "https://registry.yarnpkg.com/to-fast-properties/-/to-fast-properties-1.0.3.tgz";
        sha1 = "b83571fa4d8c25b82e231b06e3a3055de4ca1a47";
      };
    }
    {
      name = "to_fast_properties___to_fast_properties_2.0.0.tgz";
      path = fetchurl {
        name = "to_fast_properties___to_fast_properties_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/to-fast-properties/-/to-fast-properties-2.0.0.tgz";
        sha1 = "dc5e698cbd079265bc73e0377681a4e4e83f616e";
      };
    }
    {
      name = "to_object_path___to_object_path_0.3.0.tgz";
      path = fetchurl {
        name = "to_object_path___to_object_path_0.3.0.tgz";
        url  = "https://registry.yarnpkg.com/to-object-path/-/to-object-path-0.3.0.tgz";
        sha1 = "297588b7b0e7e0ac08e04e672f85c1f4999e17af";
      };
    }
    {
      name = "to_regex_range___to_regex_range_2.1.1.tgz";
      path = fetchurl {
        name = "to_regex_range___to_regex_range_2.1.1.tgz";
        url  = "https://registry.yarnpkg.com/to-regex-range/-/to-regex-range-2.1.1.tgz";
        sha1 = "7c80c17b9dfebe599e27367e0d4dd5590141db38";
      };
    }
    {
      name = "to_regex_range___to_regex_range_5.0.1.tgz";
      path = fetchurl {
        name = "to_regex_range___to_regex_range_5.0.1.tgz";
        url  = "https://registry.yarnpkg.com/to-regex-range/-/to-regex-range-5.0.1.tgz";
        sha1 = "1648c44aae7c8d988a326018ed72f5b4dd0392e4";
      };
    }
    {
      name = "to_regex___to_regex_3.0.2.tgz";
      path = fetchurl {
        name = "to_regex___to_regex_3.0.2.tgz";
        url  = "https://registry.yarnpkg.com/to-regex/-/to-regex-3.0.2.tgz";
        sha1 = "13cfdd9b336552f30b51f33a8ae1b42a7a7599ce";
      };
    }
    {
      name = "toggle_selection___toggle_selection_1.0.6.tgz";
      path = fetchurl {
        name = "toggle_selection___toggle_selection_1.0.6.tgz";
        url  = "https://registry.yarnpkg.com/toggle-selection/-/toggle-selection-1.0.6.tgz";
        sha1 = "6e45b1263f2017fa0acc7d89d78b15b8bf77da32";
      };
    }
    {
      name = "toidentifier___toidentifier_1.0.0.tgz";
      path = fetchurl {
        name = "toidentifier___toidentifier_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/toidentifier/-/toidentifier-1.0.0.tgz";
        sha1 = "7e1be3470f1e77948bc43d94a3c8f4d7752ba553";
      };
    }
    {
      name = "topojson_client___topojson_client_3.1.0.tgz";
      path = fetchurl {
        name = "topojson_client___topojson_client_3.1.0.tgz";
        url  = "https://registry.yarnpkg.com/topojson-client/-/topojson-client-3.1.0.tgz";
        sha1 = "22e8b1ed08a2b922feeb4af6f53b6ef09a467b99";
      };
    }
    {
      name = "tough_cookie___tough_cookie_2.5.0.tgz";
      path = fetchurl {
        name = "tough_cookie___tough_cookie_2.5.0.tgz";
        url  = "https://registry.yarnpkg.com/tough-cookie/-/tough-cookie-2.5.0.tgz";
        sha1 = "cd9fb2a0aa1d5a12b473bd9fb96fa3dcff65ade2";
      };
    }
    {
      name = "tough_cookie___tough_cookie_3.0.1.tgz";
      path = fetchurl {
        name = "tough_cookie___tough_cookie_3.0.1.tgz";
        url  = "https://registry.yarnpkg.com/tough-cookie/-/tough-cookie-3.0.1.tgz";
        sha1 = "9df4f57e739c26930a018184887f4adb7dca73b2";
      };
    }
    {
      name = "tr46___tr46_1.0.1.tgz";
      path = fetchurl {
        name = "tr46___tr46_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/tr46/-/tr46-1.0.1.tgz";
        sha1 = "a8b13fd6bfd2489519674ccde55ba3693b706d09";
      };
    }
    {
      name = "trim_repeated___trim_repeated_1.0.0.tgz";
      path = fetchurl {
        name = "trim_repeated___trim_repeated_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/trim-repeated/-/trim-repeated-1.0.0.tgz";
        sha1 = "e3646a2ea4e891312bf7eace6cfb05380bc01c21";
      };
    }
    {
      name = "trim_right___trim_right_1.0.1.tgz";
      path = fetchurl {
        name = "trim_right___trim_right_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/trim-right/-/trim-right-1.0.1.tgz";
        sha1 = "cb2e1203067e0c8de1f614094b9fe45704ea6003";
      };
    }
    {
      name = "ts_easing___ts_easing_0.2.0.tgz";
      path = fetchurl {
        name = "ts_easing___ts_easing_0.2.0.tgz";
        url  = "https://registry.yarnpkg.com/ts-easing/-/ts-easing-0.2.0.tgz";
        sha1 = "c8a8a35025105566588d87dbda05dd7fbfa5a4ec";
      };
    }
    {
      name = "ts_invariant___ts_invariant_0.4.4.tgz";
      path = fetchurl {
        name = "ts_invariant___ts_invariant_0.4.4.tgz";
        url  = "https://registry.yarnpkg.com/ts-invariant/-/ts-invariant-0.4.4.tgz";
        sha1 = "97a523518688f93aafad01b0e80eb803eb2abd86";
      };
    }
    {
      name = "tslib___tslib_1.11.1.tgz";
      path = fetchurl {
        name = "tslib___tslib_1.11.1.tgz";
        url  = "https://registry.yarnpkg.com/tslib/-/tslib-1.11.1.tgz";
        sha1 = "eb15d128827fbee2841549e171f45ed338ac7e35";
      };
    }
    {
      name = "tslib___tslib_2.0.3.tgz";
      path = fetchurl {
        name = "tslib___tslib_2.0.3.tgz";
        url  = "https://registry.yarnpkg.com/tslib/-/tslib-2.0.3.tgz";
        sha1 = "8e0741ac45fc0c226e58a17bfc3e64b9bc6ca61c";
      };
    }
    {
      name = "tty_browserify___tty_browserify_0.0.0.tgz";
      path = fetchurl {
        name = "tty_browserify___tty_browserify_0.0.0.tgz";
        url  = "https://registry.yarnpkg.com/tty-browserify/-/tty-browserify-0.0.0.tgz";
        sha1 = "a157ba402da24e9bf957f9aa69d524eed42901a6";
      };
    }
    {
      name = "tunnel_agent___tunnel_agent_0.6.0.tgz";
      path = fetchurl {
        name = "tunnel_agent___tunnel_agent_0.6.0.tgz";
        url  = "https://registry.yarnpkg.com/tunnel-agent/-/tunnel-agent-0.6.0.tgz";
        sha1 = "27a5dea06b36b04a0a9966774b290868f0fc40fd";
      };
    }
    {
      name = "tweetnacl___tweetnacl_0.14.5.tgz";
      path = fetchurl {
        name = "tweetnacl___tweetnacl_0.14.5.tgz";
        url  = "https://registry.yarnpkg.com/tweetnacl/-/tweetnacl-0.14.5.tgz";
        sha1 = "5ae68177f192d4456269d108afa93ff8743f4f64";
      };
    }
    {
      name = "tweezer.js___tweezer.js_1.5.0.tgz";
      path = fetchurl {
        name = "tweezer.js___tweezer.js_1.5.0.tgz";
        url  = "https://registry.yarnpkg.com/tweezer.js/-/tweezer.js-1.5.0.tgz";
        sha1 = "ca50ac5215022203fd3be4d28617e8e2305f5c0c";
      };
    }
    {
      name = "type_check___type_check_0.3.2.tgz";
      path = fetchurl {
        name = "type_check___type_check_0.3.2.tgz";
        url  = "https://registry.yarnpkg.com/type-check/-/type-check-0.3.2.tgz";
        sha1 = "5884cab512cf1d355e3fb784f30804b2b520db72";
      };
    }
    {
      name = "type_detect___type_detect_0.1.1.tgz";
      path = fetchurl {
        name = "type_detect___type_detect_0.1.1.tgz";
        url  = "https://registry.yarnpkg.com/type-detect/-/type-detect-0.1.1.tgz";
        sha1 = "0ba5ec2a885640e470ea4e8505971900dac58822";
      };
    }
    {
      name = "type_detect___type_detect_4.0.8.tgz";
      path = fetchurl {
        name = "type_detect___type_detect_4.0.8.tgz";
        url  = "https://registry.yarnpkg.com/type-detect/-/type-detect-4.0.8.tgz";
        sha1 = "7646fb5f18871cfbb7749e69bd39a6388eb7450c";
      };
    }
    {
      name = "type_detect___type_detect_1.0.0.tgz";
      path = fetchurl {
        name = "type_detect___type_detect_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/type-detect/-/type-detect-1.0.0.tgz";
        sha1 = "762217cc06db258ec48908a1298e8b95121e8ea2";
      };
    }
    {
      name = "type_fest___type_fest_0.11.0.tgz";
      path = fetchurl {
        name = "type_fest___type_fest_0.11.0.tgz";
        url  = "https://registry.yarnpkg.com/type-fest/-/type-fest-0.11.0.tgz";
        sha1 = "97abf0872310fed88a5c466b25681576145e33f1";
      };
    }
    {
      name = "type_fest___type_fest_0.6.0.tgz";
      path = fetchurl {
        name = "type_fest___type_fest_0.6.0.tgz";
        url  = "https://registry.yarnpkg.com/type-fest/-/type-fest-0.6.0.tgz";
        sha1 = "8d2a2370d3df886eb5c90ada1c5bf6188acf838b";
      };
    }
    {
      name = "type_fest___type_fest_0.8.1.tgz";
      path = fetchurl {
        name = "type_fest___type_fest_0.8.1.tgz";
        url  = "https://registry.yarnpkg.com/type-fest/-/type-fest-0.8.1.tgz";
        sha1 = "09e249ebde851d3b1e48d27c105444667f17b83d";
      };
    }
    {
      name = "typed_function___typed_function_1.1.0.tgz";
      path = fetchurl {
        name = "typed_function___typed_function_1.1.0.tgz";
        url  = "https://registry.yarnpkg.com/typed-function/-/typed-function-1.1.0.tgz";
        sha1 = "ea149706e0fb42aca1791c053a6d94ccd6c4fdcb";
      };
    }
    {
      name = "typedarray_to_buffer___typedarray_to_buffer_3.1.5.tgz";
      path = fetchurl {
        name = "typedarray_to_buffer___typedarray_to_buffer_3.1.5.tgz";
        url  = "https://registry.yarnpkg.com/typedarray-to-buffer/-/typedarray-to-buffer-3.1.5.tgz";
        sha1 = "a97ee7a9ff42691b9f783ff1bc5112fe3fca9080";
      };
    }
    {
      name = "typedarray___typedarray_0.0.6.tgz";
      path = fetchurl {
        name = "typedarray___typedarray_0.0.6.tgz";
        url  = "https://registry.yarnpkg.com/typedarray/-/typedarray-0.0.6.tgz";
        sha1 = "867ac74e3864187b1d3d47d996a78ec5c8830777";
      };
    }
    {
      name = "typescript___typescript_3.8.3.tgz";
      path = fetchurl {
        name = "typescript___typescript_3.8.3.tgz";
        url  = "https://registry.yarnpkg.com/typescript/-/typescript-3.8.3.tgz";
        sha1 = "409eb8544ea0335711205869ec458ab109ee1061";
      };
    }
    {
      name = "ua_parser_js___ua_parser_js_0.7.21.tgz";
      path = fetchurl {
        name = "ua_parser_js___ua_parser_js_0.7.21.tgz";
        url  = "https://registry.yarnpkg.com/ua-parser-js/-/ua-parser-js-0.7.21.tgz";
        sha1 = "853cf9ce93f642f67174273cc34565ae6f308777";
      };
    }
    {
      name = "uncss___uncss_0.17.3.tgz";
      path = fetchurl {
        name = "uncss___uncss_0.17.3.tgz";
        url  = "https://registry.yarnpkg.com/uncss/-/uncss-0.17.3.tgz";
        sha1 = "50fc1eb4ed573ffff763458d801cd86e4d69ea11";
      };
    }
    {
      name = "underscore___underscore_1.4.4.tgz";
      path = fetchurl {
        name = "underscore___underscore_1.4.4.tgz";
        url  = "https://registry.yarnpkg.com/underscore/-/underscore-1.4.4.tgz";
        sha1 = "61a6a32010622afa07963bf325203cf12239d604";
      };
    }
    {
      name = "unicode_canonical_property_names_ecmascript___unicode_canonical_property_names_ecmascript_1.0.4.tgz";
      path = fetchurl {
        name = "unicode_canonical_property_names_ecmascript___unicode_canonical_property_names_ecmascript_1.0.4.tgz";
        url  = "https://registry.yarnpkg.com/unicode-canonical-property-names-ecmascript/-/unicode-canonical-property-names-ecmascript-1.0.4.tgz";
        sha1 = "2619800c4c825800efdd8343af7dd9933cbe2818";
      };
    }
    {
      name = "unicode_match_property_ecmascript___unicode_match_property_ecmascript_1.0.4.tgz";
      path = fetchurl {
        name = "unicode_match_property_ecmascript___unicode_match_property_ecmascript_1.0.4.tgz";
        url  = "https://registry.yarnpkg.com/unicode-match-property-ecmascript/-/unicode-match-property-ecmascript-1.0.4.tgz";
        sha1 = "8ed2a32569961bce9227d09cd3ffbb8fed5f020c";
      };
    }
    {
      name = "unicode_match_property_value_ecmascript___unicode_match_property_value_ecmascript_1.2.0.tgz";
      path = fetchurl {
        name = "unicode_match_property_value_ecmascript___unicode_match_property_value_ecmascript_1.2.0.tgz";
        url  = "https://registry.yarnpkg.com/unicode-match-property-value-ecmascript/-/unicode-match-property-value-ecmascript-1.2.0.tgz";
        sha1 = "0d91f600eeeb3096aa962b1d6fc88876e64ea531";
      };
    }
    {
      name = "unicode_property_aliases_ecmascript___unicode_property_aliases_ecmascript_1.1.0.tgz";
      path = fetchurl {
        name = "unicode_property_aliases_ecmascript___unicode_property_aliases_ecmascript_1.1.0.tgz";
        url  = "https://registry.yarnpkg.com/unicode-property-aliases-ecmascript/-/unicode-property-aliases-ecmascript-1.1.0.tgz";
        sha1 = "dd57a99f6207bedff4628abefb94c50db941c8f4";
      };
    }
    {
      name = "unicode_trie___unicode_trie_0.3.1.tgz";
      path = fetchurl {
        name = "unicode_trie___unicode_trie_0.3.1.tgz";
        url  = "https://registry.yarnpkg.com/unicode-trie/-/unicode-trie-0.3.1.tgz";
        sha1 = "d671dddd89101a08bac37b6a5161010602052085";
      };
    }
    {
      name = "union_value___union_value_1.0.1.tgz";
      path = fetchurl {
        name = "union_value___union_value_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/union-value/-/union-value-1.0.1.tgz";
        sha1 = "0b6fe7b835aecda61c6ea4d4f02c14221e109847";
      };
    }
    {
      name = "uniq___uniq_1.0.1.tgz";
      path = fetchurl {
        name = "uniq___uniq_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/uniq/-/uniq-1.0.1.tgz";
        sha1 = "b31c5ae8254844a3a8281541ce2b04b865a734ff";
      };
    }
    {
      name = "uniqs___uniqs_2.0.0.tgz";
      path = fetchurl {
        name = "uniqs___uniqs_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/uniqs/-/uniqs-2.0.0.tgz";
        sha1 = "ffede4b36b25290696e6e165d4a59edb998e6b02";
      };
    }
    {
      name = "universalify___universalify_0.1.2.tgz";
      path = fetchurl {
        name = "universalify___universalify_0.1.2.tgz";
        url  = "https://registry.yarnpkg.com/universalify/-/universalify-0.1.2.tgz";
        sha1 = "b646f69be3942dabcecc9d6639c80dc105efaa66";
      };
    }
    {
      name = "unquote___unquote_1.1.1.tgz";
      path = fetchurl {
        name = "unquote___unquote_1.1.1.tgz";
        url  = "https://registry.yarnpkg.com/unquote/-/unquote-1.1.1.tgz";
        sha1 = "8fded7324ec6e88a0ff8b905e7c098cdc086d544";
      };
    }
    {
      name = "unset_value___unset_value_1.0.0.tgz";
      path = fetchurl {
        name = "unset_value___unset_value_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/unset-value/-/unset-value-1.0.0.tgz";
        sha1 = "8376873f7d2335179ffb1e6fc3a8ed0dfc8ab559";
      };
    }
    {
      name = "upath___upath_1.2.0.tgz";
      path = fetchurl {
        name = "upath___upath_1.2.0.tgz";
        url  = "https://registry.yarnpkg.com/upath/-/upath-1.2.0.tgz";
        sha1 = "8f66dbcd55a883acdae4408af8b035a5044c1894";
      };
    }
    {
      name = "upper_case___upper_case_1.1.3.tgz";
      path = fetchurl {
        name = "upper_case___upper_case_1.1.3.tgz";
        url  = "https://registry.yarnpkg.com/upper-case/-/upper-case-1.1.3.tgz";
        sha1 = "f6b4501c2ec4cdd26ba78be7222961de77621598";
      };
    }
    {
      name = "uri_js___uri_js_4.2.2.tgz";
      path = fetchurl {
        name = "uri_js___uri_js_4.2.2.tgz";
        url  = "https://registry.yarnpkg.com/uri-js/-/uri-js-4.2.2.tgz";
        sha1 = "94c540e1ff772956e2299507c010aea6c8838eb0";
      };
    }
    {
      name = "urix___urix_0.1.0.tgz";
      path = fetchurl {
        name = "urix___urix_0.1.0.tgz";
        url  = "https://registry.yarnpkg.com/urix/-/urix-0.1.0.tgz";
        sha1 = "da937f7a62e21fec1fd18d49b35c2935067a6c72";
      };
    }
    {
      name = "url___url_0.11.0.tgz";
      path = fetchurl {
        name = "url___url_0.11.0.tgz";
        url  = "https://registry.yarnpkg.com/url/-/url-0.11.0.tgz";
        sha1 = "3838e97cfc60521eb73c525a8e55bfdd9e2e28f1";
      };
    }
    {
      name = "use___use_3.1.1.tgz";
      path = fetchurl {
        name = "use___use_3.1.1.tgz";
        url  = "https://registry.yarnpkg.com/use/-/use-3.1.1.tgz";
        sha1 = "d50c8cac79a19fbc20f2911f56eb973f4e10070f";
      };
    }
    {
      name = "util_deprecate___util_deprecate_1.0.2.tgz";
      path = fetchurl {
        name = "util_deprecate___util_deprecate_1.0.2.tgz";
        url  = "https://registry.yarnpkg.com/util-deprecate/-/util-deprecate-1.0.2.tgz";
        sha1 = "450d4dc9fa70de732762fbd2d4a28981419a0ccf";
      };
    }
    {
      name = "util.promisify___util.promisify_1.0.1.tgz";
      path = fetchurl {
        name = "util.promisify___util.promisify_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/util.promisify/-/util.promisify-1.0.1.tgz";
        sha1 = "6baf7774b80eeb0f7520d8b81d07982a59abbaee";
      };
    }
    {
      name = "util___util_0.10.3.tgz";
      path = fetchurl {
        name = "util___util_0.10.3.tgz";
        url  = "https://registry.yarnpkg.com/util/-/util-0.10.3.tgz";
        sha1 = "7afb1afe50805246489e3db7fe0ed379336ac0f9";
      };
    }
    {
      name = "util___util_0.11.1.tgz";
      path = fetchurl {
        name = "util___util_0.11.1.tgz";
        url  = "https://registry.yarnpkg.com/util/-/util-0.11.1.tgz";
        sha1 = "3236733720ec64bb27f6e26f421aaa2e1b588d61";
      };
    }
    {
      name = "uuid___uuid_3.4.0.tgz";
      path = fetchurl {
        name = "uuid___uuid_3.4.0.tgz";
        url  = "https://registry.yarnpkg.com/uuid/-/uuid-3.4.0.tgz";
        sha1 = "b23e4358afa8a202fe7a100af1f5f883f02007ee";
      };
    }
    {
      name = "v8_compile_cache___v8_compile_cache_2.1.0.tgz";
      path = fetchurl {
        name = "v8_compile_cache___v8_compile_cache_2.1.0.tgz";
        url  = "https://registry.yarnpkg.com/v8-compile-cache/-/v8-compile-cache-2.1.0.tgz";
        sha1 = "e14de37b31a6d194f5690d67efc4e7f6fc6ab30e";
      };
    }
    {
      name = "v8_to_istanbul___v8_to_istanbul_4.1.3.tgz";
      path = fetchurl {
        name = "v8_to_istanbul___v8_to_istanbul_4.1.3.tgz";
        url  = "https://registry.yarnpkg.com/v8-to-istanbul/-/v8-to-istanbul-4.1.3.tgz";
        sha1 = "22fe35709a64955f49a08a7c7c959f6520ad6f20";
      };
    }
    {
      name = "validate_npm_package_license___validate_npm_package_license_3.0.4.tgz";
      path = fetchurl {
        name = "validate_npm_package_license___validate_npm_package_license_3.0.4.tgz";
        url  = "https://registry.yarnpkg.com/validate-npm-package-license/-/validate-npm-package-license-3.0.4.tgz";
        sha1 = "fc91f6b9c7ba15c857f4cb2c5defeec39d4f410a";
      };
    }
    {
      name = "vega_canvas___vega_canvas_1.2.2.tgz";
      path = fetchurl {
        name = "vega_canvas___vega_canvas_1.2.2.tgz";
        url  = "https://registry.yarnpkg.com/vega-canvas/-/vega-canvas-1.2.2.tgz";
        sha1 = "f31aae9ac1e1ed01bb7817a1e53099279e2d3d43";
      };
    }
    {
      name = "vega_canvas___vega_canvas_1.2.6.tgz";
      path = fetchurl {
        name = "vega_canvas___vega_canvas_1.2.6.tgz";
        url  = "https://registry.yarnpkg.com/vega-canvas/-/vega-canvas-1.2.6.tgz";
        sha1 = "55e032ce9a62acd17229f6bac66d99db3d6879cd";
      };
    }
    {
      name = "vega_crossfilter___vega_crossfilter_4.0.2.tgz";
      path = fetchurl {
        name = "vega_crossfilter___vega_crossfilter_4.0.2.tgz";
        url  = "https://registry.yarnpkg.com/vega-crossfilter/-/vega-crossfilter-4.0.2.tgz";
        sha1 = "739a26eb8eb741b3e1725679d09ee2af56f983b5";
      };
    }
    {
      name = "vega_crossfilter___vega_crossfilter_4.0.5.tgz";
      path = fetchurl {
        name = "vega_crossfilter___vega_crossfilter_4.0.5.tgz";
        url  = "https://registry.yarnpkg.com/vega-crossfilter/-/vega-crossfilter-4.0.5.tgz";
        sha1 = "cf6a5fca60821928f976b32f22cf66cfd9cbeeae";
      };
    }
    {
      name = "vega_dataflow___vega_dataflow_5.5.1.tgz";
      path = fetchurl {
        name = "vega_dataflow___vega_dataflow_5.5.1.tgz";
        url  = "https://registry.yarnpkg.com/vega-dataflow/-/vega-dataflow-5.5.1.tgz";
        sha1 = "65dd244ab678bb91d60cee0eab3c8e5d588cee1c";
      };
    }
    {
      name = "vega_dataflow___vega_dataflow_5.7.3.tgz";
      path = fetchurl {
        name = "vega_dataflow___vega_dataflow_5.7.3.tgz";
        url  = "https://registry.yarnpkg.com/vega-dataflow/-/vega-dataflow-5.7.3.tgz";
        sha1 = "66ca06a61f72a210b0732e3b6cc1eec5117197f7";
      };
    }
    {
      name = "vega_embed___vega_embed_6.6.0.tgz";
      path = fetchurl {
        name = "vega_embed___vega_embed_6.6.0.tgz";
        url  = "https://registry.yarnpkg.com/vega-embed/-/vega-embed-6.6.0.tgz";
        sha1 = "a11046069ceb8774c63c35533f2d2aac72789d16";
      };
    }
    {
      name = "vega_embed___vega_embed_6.10.0.tgz";
      path = fetchurl {
        name = "vega_embed___vega_embed_6.10.0.tgz";
        url  = "https://registry.yarnpkg.com/vega-embed/-/vega-embed-6.10.0.tgz";
        sha1 = "75b2947fb75ccecd0d506296ea2b5c1f9295208c";
      };
    }
    {
      name = "vega_encode___vega_encode_4.6.0.tgz";
      path = fetchurl {
        name = "vega_encode___vega_encode_4.6.0.tgz";
        url  = "https://registry.yarnpkg.com/vega-encode/-/vega-encode-4.6.0.tgz";
        sha1 = "20456f579da15074f585eae7cdc730ce132095bd";
      };
    }
    {
      name = "vega_encode___vega_encode_4.8.3.tgz";
      path = fetchurl {
        name = "vega_encode___vega_encode_4.8.3.tgz";
        url  = "https://registry.yarnpkg.com/vega-encode/-/vega-encode-4.8.3.tgz";
        sha1 = "b3048fb39845d72f18d8dc302ad697f826e0ff83";
      };
    }
    {
      name = "vega_event_selector___vega_event_selector_2.0.3.tgz";
      path = fetchurl {
        name = "vega_event_selector___vega_event_selector_2.0.3.tgz";
        url  = "https://registry.yarnpkg.com/vega-event-selector/-/vega-event-selector-2.0.3.tgz";
        sha1 = "760c61af7ab5c325d3274fd3ab284d067ff16f8c";
      };
    }
    {
      name = "vega_event_selector___vega_event_selector_2.0.6.tgz";
      path = fetchurl {
        name = "vega_event_selector___vega_event_selector_2.0.6.tgz";
        url  = "https://registry.yarnpkg.com/vega-event-selector/-/vega-event-selector-2.0.6.tgz";
        sha1 = "6beb00e066b78371dde1a0f40cb5e0bbaecfd8bc";
      };
    }
    {
      name = "vega_expression___vega_expression_2.6.4.tgz";
      path = fetchurl {
        name = "vega_expression___vega_expression_2.6.4.tgz";
        url  = "https://registry.yarnpkg.com/vega-expression/-/vega-expression-2.6.4.tgz";
        sha1 = "f8098e974dedb1614474b260193332d51961fae3";
      };
    }
    {
      name = "vega_expression___vega_expression_3.0.0.tgz";
      path = fetchurl {
        name = "vega_expression___vega_expression_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/vega-expression/-/vega-expression-3.0.0.tgz";
        sha1 = "39179d010b34c57513162bf1ab5a7bff4b31be91";
      };
    }
    {
      name = "vega_force___vega_force_4.0.4.tgz";
      path = fetchurl {
        name = "vega_force___vega_force_4.0.4.tgz";
        url  = "https://registry.yarnpkg.com/vega-force/-/vega-force-4.0.4.tgz";
        sha1 = "b73cba2e169cc248c994c9d981c374eb06aff764";
      };
    }
    {
      name = "vega_force___vega_force_4.0.7.tgz";
      path = fetchurl {
        name = "vega_force___vega_force_4.0.7.tgz";
        url  = "https://registry.yarnpkg.com/vega-force/-/vega-force-4.0.7.tgz";
        sha1 = "6dc39ecb7889d9102661244d62fbc8d8714162ee";
      };
    }
    {
      name = "vega_format___vega_format_1.0.4.tgz";
      path = fetchurl {
        name = "vega_format___vega_format_1.0.4.tgz";
        url  = "https://registry.yarnpkg.com/vega-format/-/vega-format-1.0.4.tgz";
        sha1 = "40c0c252d11128738b845ee73d8173f8064d6626";
      };
    }
    {
      name = "vega_functions___vega_functions_5.6.0.tgz";
      path = fetchurl {
        name = "vega_functions___vega_functions_5.6.0.tgz";
        url  = "https://registry.yarnpkg.com/vega-functions/-/vega-functions-5.6.0.tgz";
        sha1 = "a8f5c6060cefbcfc9aef19bf55370e0db18f82d1";
      };
    }
    {
      name = "vega_functions___vega_functions_5.8.0.tgz";
      path = fetchurl {
        name = "vega_functions___vega_functions_5.8.0.tgz";
        url  = "https://registry.yarnpkg.com/vega-functions/-/vega-functions-5.8.0.tgz";
        sha1 = "48e02b0e5b14261cd445bda3c4721a18b02c810c";
      };
    }
    {
      name = "vega_geo___vega_geo_4.3.1.tgz";
      path = fetchurl {
        name = "vega_geo___vega_geo_4.3.1.tgz";
        url  = "https://registry.yarnpkg.com/vega-geo/-/vega-geo-4.3.1.tgz";
        sha1 = "825487d6ae07037a0091e68a140bf159f190b0df";
      };
    }
    {
      name = "vega_geo___vega_geo_4.3.7.tgz";
      path = fetchurl {
        name = "vega_geo___vega_geo_4.3.7.tgz";
        url  = "https://registry.yarnpkg.com/vega-geo/-/vega-geo-4.3.7.tgz";
        sha1 = "4220137458a17d422fa15705f24905ba2595ca40";
      };
    }
    {
      name = "vega_hierarchy___vega_hierarchy_4.0.5.tgz";
      path = fetchurl {
        name = "vega_hierarchy___vega_hierarchy_4.0.5.tgz";
        url  = "https://registry.yarnpkg.com/vega-hierarchy/-/vega-hierarchy-4.0.5.tgz";
        sha1 = "6f08e173c315f9c60abd931d03af7ed50246f27e";
      };
    }
    {
      name = "vega_hierarchy___vega_hierarchy_4.0.9.tgz";
      path = fetchurl {
        name = "vega_hierarchy___vega_hierarchy_4.0.9.tgz";
        url  = "https://registry.yarnpkg.com/vega-hierarchy/-/vega-hierarchy-4.0.9.tgz";
        sha1 = "4b4bafbc181a14a280ecdbee8874c0db7e369f47";
      };
    }
    {
      name = "vega_label___vega_label_1.0.0.tgz";
      path = fetchurl {
        name = "vega_label___vega_label_1.0.0.tgz";
        url  = "https://registry.yarnpkg.com/vega-label/-/vega-label-1.0.0.tgz";
        sha1 = "c3bea3a608a62217ca554ecc0f7fe0395d81bd1b";
      };
    }
    {
      name = "vega_lite___vega_lite_4.17.0.tgz";
      path = fetchurl {
        name = "vega_lite___vega_lite_4.17.0.tgz";
        url  = "https://registry.yarnpkg.com/vega-lite/-/vega-lite-4.17.0.tgz";
        sha1 = "01ad4535e92f28c3852c1071711de272ddfb4631";
      };
    }
    {
      name = "vega_loader___vega_loader_4.2.2.tgz";
      path = fetchurl {
        name = "vega_loader___vega_loader_4.2.2.tgz";
        url  = "https://registry.yarnpkg.com/vega-loader/-/vega-loader-4.2.2.tgz";
        sha1 = "a9375f339c558dc1d083cabd2f8c29d8142b18f8";
      };
    }
    {
      name = "vega_loader___vega_loader_4.4.0.tgz";
      path = fetchurl {
        name = "vega_loader___vega_loader_4.4.0.tgz";
        url  = "https://registry.yarnpkg.com/vega-loader/-/vega-loader-4.4.0.tgz";
        sha1 = "fc515b7368c46b2be8df1fcf3c35c696c13c453d";
      };
    }
    {
      name = "vega_parser___vega_parser_5.14.0.tgz";
      path = fetchurl {
        name = "vega_parser___vega_parser_5.14.0.tgz";
        url  = "https://registry.yarnpkg.com/vega-parser/-/vega-parser-5.14.0.tgz";
        sha1 = "3b6cc4fab40ef275b76ec0dd34600b9098b47003";
      };
    }
    {
      name = "vega_parser___vega_parser_6.1.0.tgz";
      path = fetchurl {
        name = "vega_parser___vega_parser_6.1.0.tgz";
        url  = "https://registry.yarnpkg.com/vega-parser/-/vega-parser-6.1.0.tgz";
        sha1 = "485fb6fcd79d14b09efee340e2b55fb510e57e20";
      };
    }
    {
      name = "vega_projection___vega_projection_1.4.1.tgz";
      path = fetchurl {
        name = "vega_projection___vega_projection_1.4.1.tgz";
        url  = "https://registry.yarnpkg.com/vega-projection/-/vega-projection-1.4.1.tgz";
        sha1 = "653f8def85c0440669e6700b9126fe70bac2da9e";
      };
    }
    {
      name = "vega_projection___vega_projection_1.4.5.tgz";
      path = fetchurl {
        name = "vega_projection___vega_projection_1.4.5.tgz";
        url  = "https://registry.yarnpkg.com/vega-projection/-/vega-projection-1.4.5.tgz";
        sha1 = "020cb646b4eaae535359da25f4f48eef8d324af2";
      };
    }
    {
      name = "vega_regression___vega_regression_1.0.6.tgz";
      path = fetchurl {
        name = "vega_regression___vega_regression_1.0.6.tgz";
        url  = "https://registry.yarnpkg.com/vega-regression/-/vega-regression-1.0.6.tgz";
        sha1 = "0081a91328e933c826813c06afe7041915532d4f";
      };
    }
    {
      name = "vega_regression___vega_regression_1.0.9.tgz";
      path = fetchurl {
        name = "vega_regression___vega_regression_1.0.9.tgz";
        url  = "https://registry.yarnpkg.com/vega-regression/-/vega-regression-1.0.9.tgz";
        sha1 = "f33da47fe457e03ad134782c11414bcef7b1da82";
      };
    }
    {
      name = "vega_runtime___vega_runtime_5.0.3.tgz";
      path = fetchurl {
        name = "vega_runtime___vega_runtime_5.0.3.tgz";
        url  = "https://registry.yarnpkg.com/vega-runtime/-/vega-runtime-5.0.3.tgz";
        sha1 = "634d9b7d7558dbc855ea1d4751e01b8f52e03d74";
      };
    }
    {
      name = "vega_runtime___vega_runtime_6.1.3.tgz";
      path = fetchurl {
        name = "vega_runtime___vega_runtime_6.1.3.tgz";
        url  = "https://registry.yarnpkg.com/vega-runtime/-/vega-runtime-6.1.3.tgz";
        sha1 = "01e18246f7a80cee034a96017ac30113b92c4034";
      };
    }
    {
      name = "vega_scale___vega_scale_6.1.0.tgz";
      path = fetchurl {
        name = "vega_scale___vega_scale_6.1.0.tgz";
        url  = "https://registry.yarnpkg.com/vega-scale/-/vega-scale-6.1.0.tgz";
        sha1 = "eab5b5dba2c14548ea8ea29a4f13169c443f9d84";
      };
    }
    {
      name = "vega_scale___vega_scale_7.1.1.tgz";
      path = fetchurl {
        name = "vega_scale___vega_scale_7.1.1.tgz";
        url  = "https://registry.yarnpkg.com/vega-scale/-/vega-scale-7.1.1.tgz";
        sha1 = "b69a38d1980f6fc1093390f796e556be63fdc808";
      };
    }
    {
      name = "vega_scenegraph___vega_scenegraph_4.7.1.tgz";
      path = fetchurl {
        name = "vega_scenegraph___vega_scenegraph_4.7.1.tgz";
        url  = "https://registry.yarnpkg.com/vega-scenegraph/-/vega-scenegraph-4.7.1.tgz";
        sha1 = "b7dd1ed81f231349a89c9ff19a949e2afeb255da";
      };
    }
    {
      name = "vega_scenegraph___vega_scenegraph_4.9.2.tgz";
      path = fetchurl {
        name = "vega_scenegraph___vega_scenegraph_4.9.2.tgz";
        url  = "https://registry.yarnpkg.com/vega-scenegraph/-/vega-scenegraph-4.9.2.tgz";
        sha1 = "83b1dbc34a9ab5595c74d547d6d95849d74451ed";
      };
    }
    {
      name = "vega_schema_url_parser___vega_schema_url_parser_1.1.0.tgz";
      path = fetchurl {
        name = "vega_schema_url_parser___vega_schema_url_parser_1.1.0.tgz";
        url  = "https://registry.yarnpkg.com/vega-schema-url-parser/-/vega-schema-url-parser-1.1.0.tgz";
        sha1 = "39168ec04e5468ce278a06c16ec0d126035a85b5";
      };
    }
    {
      name = "vega_selections___vega_selections_5.1.1.tgz";
      path = fetchurl {
        name = "vega_selections___vega_selections_5.1.1.tgz";
        url  = "https://registry.yarnpkg.com/vega-selections/-/vega-selections-5.1.1.tgz";
        sha1 = "5ea3931bbf7bc13f2ab7c5c5ebf39aed98e4c114";
      };
    }
    {
      name = "vega_selections___vega_selections_5.1.4.tgz";
      path = fetchurl {
        name = "vega_selections___vega_selections_5.1.4.tgz";
        url  = "https://registry.yarnpkg.com/vega-selections/-/vega-selections-5.1.4.tgz";
        sha1 = "cc086fac5b4e646f9f1e000777f8786782d8516a";
      };
    }
    {
      name = "vega_statistics___vega_statistics_1.7.5.tgz";
      path = fetchurl {
        name = "vega_statistics___vega_statistics_1.7.5.tgz";
        url  = "https://registry.yarnpkg.com/vega-statistics/-/vega-statistics-1.7.5.tgz";
        sha1 = "da57461f95be942c93f86644631da46bc0e9bea0";
      };
    }
    {
      name = "vega_statistics___vega_statistics_1.7.9.tgz";
      path = fetchurl {
        name = "vega_statistics___vega_statistics_1.7.9.tgz";
        url  = "https://registry.yarnpkg.com/vega-statistics/-/vega-statistics-1.7.9.tgz";
        sha1 = "feec01d463e1b50593d890d20631f72138fcb65d";
      };
    }
    {
      name = "vega_themes___vega_themes_2.8.3.tgz";
      path = fetchurl {
        name = "vega_themes___vega_themes_2.8.3.tgz";
        url  = "https://registry.yarnpkg.com/vega-themes/-/vega-themes-2.8.3.tgz";
        sha1 = "3f42a9d29b7274bf963d9d4e1c30ac0d5841d4fa";
      };
    }
    {
      name = "vega_themes___vega_themes_2.8.5.tgz";
      path = fetchurl {
        name = "vega_themes___vega_themes_2.8.5.tgz";
        url  = "https://registry.yarnpkg.com/vega-themes/-/vega-themes-2.8.5.tgz";
        sha1 = "f53c96676a1f28872b2c0e924da5f211613ce3a7";
      };
    }
    {
      name = "vega_time___vega_time_1.1.0.tgz";
      path = fetchurl {
        name = "vega_time___vega_time_1.1.0.tgz";
        url  = "https://registry.yarnpkg.com/vega-time/-/vega-time-1.1.0.tgz";
        sha1 = "aedbffaf6d982c43e3b5e7014c9b2fc6bd74434c";
      };
    }
    {
      name = "vega_time___vega_time_2.0.4.tgz";
      path = fetchurl {
        name = "vega_time___vega_time_2.0.4.tgz";
        url  = "https://registry.yarnpkg.com/vega-time/-/vega-time-2.0.4.tgz";
        sha1 = "ff308358a831de927caa44e281cdc96f0863ba08";
      };
    }
    {
      name = "vega_tooltip___vega_tooltip_0.22.1.tgz";
      path = fetchurl {
        name = "vega_tooltip___vega_tooltip_0.22.1.tgz";
        url  = "https://registry.yarnpkg.com/vega-tooltip/-/vega-tooltip-0.22.1.tgz";
        sha1 = "231d6c8a105b6ac531bf8275cd0950c30373e558";
      };
    }
    {
      name = "vega_tooltip___vega_tooltip_0.23.2.tgz";
      path = fetchurl {
        name = "vega_tooltip___vega_tooltip_0.23.2.tgz";
        url  = "https://registry.yarnpkg.com/vega-tooltip/-/vega-tooltip-0.23.2.tgz";
        sha1 = "f4e22c4ce967ce9f1de6518381a74f6fe5102a86";
      };
    }
    {
      name = "vega_transforms___vega_transforms_4.7.2.tgz";
      path = fetchurl {
        name = "vega_transforms___vega_transforms_4.7.2.tgz";
        url  = "https://registry.yarnpkg.com/vega-transforms/-/vega-transforms-4.7.2.tgz";
        sha1 = "29e3e0a7f662b756c563abc4eb06465aecdda940";
      };
    }
    {
      name = "vega_transforms___vega_transforms_4.9.3.tgz";
      path = fetchurl {
        name = "vega_transforms___vega_transforms_4.9.3.tgz";
        url  = "https://registry.yarnpkg.com/vega-transforms/-/vega-transforms-4.9.3.tgz";
        sha1 = "40e5234b956a68eaa03eedf489ed03293075bbfb";
      };
    }
    {
      name = "vega_typings___vega_typings_0.16.0.tgz";
      path = fetchurl {
        name = "vega_typings___vega_typings_0.16.0.tgz";
        url  = "https://registry.yarnpkg.com/vega-typings/-/vega-typings-0.16.0.tgz";
        sha1 = "f1b618d04d721069462dacd90193501aad45f1ed";
      };
    }
    {
      name = "vega_typings___vega_typings_0.19.1.tgz";
      path = fetchurl {
        name = "vega_typings___vega_typings_0.19.1.tgz";
        url  = "https://registry.yarnpkg.com/vega-typings/-/vega-typings-0.19.1.tgz";
        sha1 = "a53949143fa37721ae7bd146bbb9add5c78aca52";
      };
    }
    {
      name = "vega_util___vega_util_1.13.2.tgz";
      path = fetchurl {
        name = "vega_util___vega_util_1.13.2.tgz";
        url  = "https://registry.yarnpkg.com/vega-util/-/vega-util-1.13.2.tgz";
        sha1 = "d9fe2378f0e780290e231d128d8c125407fb3559";
      };
    }
    {
      name = "vega_util___vega_util_1.14.1.tgz";
      path = fetchurl {
        name = "vega_util___vega_util_1.14.1.tgz";
        url  = "https://registry.yarnpkg.com/vega-util/-/vega-util-1.14.1.tgz";
        sha1 = "0fb614277764f98738ba0b80e5cdfbe663426183";
      };
    }
    {
      name = "vega_util___vega_util_1.16.0.tgz";
      path = fetchurl {
        name = "vega_util___vega_util_1.16.0.tgz";
        url  = "https://registry.yarnpkg.com/vega-util/-/vega-util-1.16.0.tgz";
        sha1 = "77405d8df0a94944d106bdc36015f0d43aa2caa3";
      };
    }
    {
      name = "vega_view_transforms___vega_view_transforms_4.5.4.tgz";
      path = fetchurl {
        name = "vega_view_transforms___vega_view_transforms_4.5.4.tgz";
        url  = "https://registry.yarnpkg.com/vega-view-transforms/-/vega-view-transforms-4.5.4.tgz";
        sha1 = "e27049e0b6cab8271ac06e1e9c0ebcbbd901b1a0";
      };
    }
    {
      name = "vega_view_transforms___vega_view_transforms_4.5.8.tgz";
      path = fetchurl {
        name = "vega_view_transforms___vega_view_transforms_4.5.8.tgz";
        url  = "https://registry.yarnpkg.com/vega-view-transforms/-/vega-view-transforms-4.5.8.tgz";
        sha1 = "c8dc42c3c7d4aa725d40b8775180c9f23bc98f4e";
      };
    }
    {
      name = "vega_view___vega_view_5.6.0.tgz";
      path = fetchurl {
        name = "vega_view___vega_view_5.6.0.tgz";
        url  = "https://registry.yarnpkg.com/vega-view/-/vega-view-5.6.0.tgz";
        sha1 = "1b045c207b2d8c55f29d9922bde46dea40185eb1";
      };
    }
    {
      name = "vega_view___vega_view_5.9.0.tgz";
      path = fetchurl {
        name = "vega_view___vega_view_5.9.0.tgz";
        url  = "https://registry.yarnpkg.com/vega-view/-/vega-view-5.9.0.tgz";
        sha1 = "ee6d5abd66d2503dec71e05e7ca8cf813465ae3f";
      };
    }
    {
      name = "vega_voronoi___vega_voronoi_4.1.2.tgz";
      path = fetchurl {
        name = "vega_voronoi___vega_voronoi_4.1.2.tgz";
        url  = "https://registry.yarnpkg.com/vega-voronoi/-/vega-voronoi-4.1.2.tgz";
        sha1 = "459b78f5191fb707e94d9afa7d8c1a68ad9aec7a";
      };
    }
    {
      name = "vega_voronoi___vega_voronoi_4.1.5.tgz";
      path = fetchurl {
        name = "vega_voronoi___vega_voronoi_4.1.5.tgz";
        url  = "https://registry.yarnpkg.com/vega-voronoi/-/vega-voronoi-4.1.5.tgz";
        sha1 = "e7af574d4c27fd9cb12d70082f12c6f59b80b445";
      };
    }
    {
      name = "vega_wordcloud___vega_wordcloud_4.0.5.tgz";
      path = fetchurl {
        name = "vega_wordcloud___vega_wordcloud_4.0.5.tgz";
        url  = "https://registry.yarnpkg.com/vega-wordcloud/-/vega-wordcloud-4.0.5.tgz";
        sha1 = "ca1ca4c329d4c0b96739cff82064711b707764de";
      };
    }
    {
      name = "vega_wordcloud___vega_wordcloud_4.1.3.tgz";
      path = fetchurl {
        name = "vega_wordcloud___vega_wordcloud_4.1.3.tgz";
        url  = "https://registry.yarnpkg.com/vega-wordcloud/-/vega-wordcloud-4.1.3.tgz";
        sha1 = "ce90900333f4e0d3ee706ba4f36bb0905f8b4a9f";
      };
    }
    {
      name = "vega___vega_5.17.0.tgz";
      path = fetchurl {
        name = "vega___vega_5.17.0.tgz";
        url  = "https://registry.yarnpkg.com/vega/-/vega-5.17.0.tgz";
        sha1 = "2b33296e257c97b79ee6501d4d1905fb1414d080";
      };
    }
    {
      name = "vega___vega_5.11.1.tgz";
      path = fetchurl {
        name = "vega___vega_5.11.1.tgz";
        url  = "https://registry.yarnpkg.com/vega/-/vega-5.11.1.tgz";
        sha1 = "57c989fd7b4af3e1e964fae66ba790cb69a339cc";
      };
    }
    {
      name = "vendors___vendors_1.0.4.tgz";
      path = fetchurl {
        name = "vendors___vendors_1.0.4.tgz";
        url  = "https://registry.yarnpkg.com/vendors/-/vendors-1.0.4.tgz";
        sha1 = "e2b800a53e7a29b93506c3cf41100d16c4c4ad8e";
      };
    }
    {
      name = "verror___verror_1.10.0.tgz";
      path = fetchurl {
        name = "verror___verror_1.10.0.tgz";
        url  = "https://registry.yarnpkg.com/verror/-/verror-1.10.0.tgz";
        sha1 = "3a105ca17053af55d6e270c1f8288682e18da400";
      };
    }
    {
      name = "vlq___vlq_0.2.3.tgz";
      path = fetchurl {
        name = "vlq___vlq_0.2.3.tgz";
        url  = "https://registry.yarnpkg.com/vlq/-/vlq-0.2.3.tgz";
        sha1 = "8f3e4328cf63b1540c0d67e1b2778386f8975b26";
      };
    }
    {
      name = "vm_browserify___vm_browserify_1.1.2.tgz";
      path = fetchurl {
        name = "vm_browserify___vm_browserify_1.1.2.tgz";
        url  = "https://registry.yarnpkg.com/vm-browserify/-/vm-browserify-1.1.2.tgz";
        sha1 = "78641c488b8e6ca91a75f511e7a3b32a86e5dda0";
      };
    }
    {
      name = "w3c_hr_time___w3c_hr_time_1.0.2.tgz";
      path = fetchurl {
        name = "w3c_hr_time___w3c_hr_time_1.0.2.tgz";
        url  = "https://registry.yarnpkg.com/w3c-hr-time/-/w3c-hr-time-1.0.2.tgz";
        sha1 = "0a89cdf5cc15822df9c360543676963e0cc308cd";
      };
    }
    {
      name = "w3c_xmlserializer___w3c_xmlserializer_1.1.2.tgz";
      path = fetchurl {
        name = "w3c_xmlserializer___w3c_xmlserializer_1.1.2.tgz";
        url  = "https://registry.yarnpkg.com/w3c-xmlserializer/-/w3c-xmlserializer-1.1.2.tgz";
        sha1 = "30485ca7d70a6fd052420a3d12fd90e6339ce794";
      };
    }
    {
      name = "walker___walker_1.0.7.tgz";
      path = fetchurl {
        name = "walker___walker_1.0.7.tgz";
        url  = "https://registry.yarnpkg.com/walker/-/walker-1.0.7.tgz";
        sha1 = "2f7f9b8fd10d677262b18a884e28d19618e028fb";
      };
    }
    {
      name = "warning___warning_4.0.3.tgz";
      path = fetchurl {
        name = "warning___warning_4.0.3.tgz";
        url  = "https://registry.yarnpkg.com/warning/-/warning-4.0.3.tgz";
        sha1 = "16e9e077eb8a86d6af7d64aa1e05fd85b4678ca3";
      };
    }
    {
      name = "warning___warning_3.0.0.tgz";
      path = fetchurl {
        name = "warning___warning_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/warning/-/warning-3.0.0.tgz";
        sha1 = "32e5377cb572de4ab04753bdf8821c01ed605b7c";
      };
    }
    {
      name = "wcwidth___wcwidth_1.0.1.tgz";
      path = fetchurl {
        name = "wcwidth___wcwidth_1.0.1.tgz";
        url  = "https://registry.yarnpkg.com/wcwidth/-/wcwidth-1.0.1.tgz";
        sha1 = "f0b0dcf915bc5ff1528afadb2c0e17b532da2fe8";
      };
    }
    {
      name = "webidl_conversions___webidl_conversions_4.0.2.tgz";
      path = fetchurl {
        name = "webidl_conversions___webidl_conversions_4.0.2.tgz";
        url  = "https://registry.yarnpkg.com/webidl-conversions/-/webidl-conversions-4.0.2.tgz";
        sha1 = "a855980b1f0b6b359ba1d5d9fb39ae941faa63ad";
      };
    }
    {
      name = "whatwg_encoding___whatwg_encoding_1.0.5.tgz";
      path = fetchurl {
        name = "whatwg_encoding___whatwg_encoding_1.0.5.tgz";
        url  = "https://registry.yarnpkg.com/whatwg-encoding/-/whatwg-encoding-1.0.5.tgz";
        sha1 = "5abacf777c32166a51d085d6b4f3e7d27113ddb0";
      };
    }
    {
      name = "whatwg_fetch___whatwg_fetch_3.0.0.tgz";
      path = fetchurl {
        name = "whatwg_fetch___whatwg_fetch_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/whatwg-fetch/-/whatwg-fetch-3.0.0.tgz";
        sha1 = "fc804e458cc460009b1a2b966bc8817d2578aefb";
      };
    }
    {
      name = "whatwg_mimetype___whatwg_mimetype_2.3.0.tgz";
      path = fetchurl {
        name = "whatwg_mimetype___whatwg_mimetype_2.3.0.tgz";
        url  = "https://registry.yarnpkg.com/whatwg-mimetype/-/whatwg-mimetype-2.3.0.tgz";
        sha1 = "3d4b1e0312d2079879f826aff18dbeeca5960fbf";
      };
    }
    {
      name = "whatwg_url___whatwg_url_7.1.0.tgz";
      path = fetchurl {
        name = "whatwg_url___whatwg_url_7.1.0.tgz";
        url  = "https://registry.yarnpkg.com/whatwg-url/-/whatwg-url-7.1.0.tgz";
        sha1 = "c2c492f1eca612988efd3d2266be1b9fc6170d06";
      };
    }
    {
      name = "which_module___which_module_2.0.0.tgz";
      path = fetchurl {
        name = "which_module___which_module_2.0.0.tgz";
        url  = "https://registry.yarnpkg.com/which-module/-/which-module-2.0.0.tgz";
        sha1 = "d9ef07dce77b9902b8a3a8fa4b31c3e3f7e6e87a";
      };
    }
    {
      name = "which___which_1.3.1.tgz";
      path = fetchurl {
        name = "which___which_1.3.1.tgz";
        url  = "https://registry.yarnpkg.com/which/-/which-1.3.1.tgz";
        sha1 = "a45043d54f5805316da8d62f9f50918d3da70b0a";
      };
    }
    {
      name = "which___which_2.0.2.tgz";
      path = fetchurl {
        name = "which___which_2.0.2.tgz";
        url  = "https://registry.yarnpkg.com/which/-/which-2.0.2.tgz";
        sha1 = "7c6a8dd0a636a0327e10b59c9286eee93f3f51b1";
      };
    }
    {
      name = "word_wrap___word_wrap_1.2.3.tgz";
      path = fetchurl {
        name = "word_wrap___word_wrap_1.2.3.tgz";
        url  = "https://registry.yarnpkg.com/word-wrap/-/word-wrap-1.2.3.tgz";
        sha1 = "610636f6b1f703891bd34771ccb17fb93b47079c";
      };
    }
    {
      name = "wrap_ansi___wrap_ansi_2.1.0.tgz";
      path = fetchurl {
        name = "wrap_ansi___wrap_ansi_2.1.0.tgz";
        url  = "https://registry.yarnpkg.com/wrap-ansi/-/wrap-ansi-2.1.0.tgz";
        sha1 = "d8fc3d284dd05794fe84973caecdd1cf824fdd85";
      };
    }
    {
      name = "wrap_ansi___wrap_ansi_5.1.0.tgz";
      path = fetchurl {
        name = "wrap_ansi___wrap_ansi_5.1.0.tgz";
        url  = "https://registry.yarnpkg.com/wrap-ansi/-/wrap-ansi-5.1.0.tgz";
        sha1 = "1fd1f67235d5b6d0fee781056001bfb694c03b09";
      };
    }
    {
      name = "wrap_ansi___wrap_ansi_6.2.0.tgz";
      path = fetchurl {
        name = "wrap_ansi___wrap_ansi_6.2.0.tgz";
        url  = "https://registry.yarnpkg.com/wrap-ansi/-/wrap-ansi-6.2.0.tgz";
        sha1 = "e9393ba07102e6c91a3b221478f0257cd2856e53";
      };
    }
    {
      name = "wrap_ansi___wrap_ansi_7.0.0.tgz";
      path = fetchurl {
        name = "wrap_ansi___wrap_ansi_7.0.0.tgz";
        url  = "https://registry.yarnpkg.com/wrap-ansi/-/wrap-ansi-7.0.0.tgz";
        sha1 = "67e145cff510a6a6984bdf1152911d69d2eb9e43";
      };
    }
    {
      name = "wrappy___wrappy_1.0.2.tgz";
      path = fetchurl {
        name = "wrappy___wrappy_1.0.2.tgz";
        url  = "https://registry.yarnpkg.com/wrappy/-/wrappy-1.0.2.tgz";
        sha1 = "b5243d8f3ec1aa35f1364605bc0d1036e30ab69f";
      };
    }
    {
      name = "write_file_atomic___write_file_atomic_3.0.3.tgz";
      path = fetchurl {
        name = "write_file_atomic___write_file_atomic_3.0.3.tgz";
        url  = "https://registry.yarnpkg.com/write-file-atomic/-/write-file-atomic-3.0.3.tgz";
        sha1 = "56bd5c5a5c70481cd19c571bd39ab965a5de56e8";
      };
    }
    {
      name = "ws___ws_5.2.2.tgz";
      path = fetchurl {
        name = "ws___ws_5.2.2.tgz";
        url  = "https://registry.yarnpkg.com/ws/-/ws-5.2.2.tgz";
        sha1 = "dffef14866b8e8dc9133582514d1befaf96e980f";
      };
    }
    {
      name = "ws___ws_6.2.1.tgz";
      path = fetchurl {
        name = "ws___ws_6.2.1.tgz";
        url  = "https://registry.yarnpkg.com/ws/-/ws-6.2.1.tgz";
        sha1 = "442fdf0a47ed64f59b6a5d8ff130f4748ed524fb";
      };
    }
    {
      name = "ws___ws_7.2.5.tgz";
      path = fetchurl {
        name = "ws___ws_7.2.5.tgz";
        url  = "https://registry.yarnpkg.com/ws/-/ws-7.2.5.tgz";
        sha1 = "abb1370d4626a5a9cd79d8de404aa18b3465d10d";
      };
    }
    {
      name = "xml_name_validator___xml_name_validator_3.0.0.tgz";
      path = fetchurl {
        name = "xml_name_validator___xml_name_validator_3.0.0.tgz";
        url  = "https://registry.yarnpkg.com/xml-name-validator/-/xml-name-validator-3.0.0.tgz";
        sha1 = "6ae73e06de4d8c6e47f9fb181f78d648ad457c6a";
      };
    }
    {
      name = "xmlchars___xmlchars_2.2.0.tgz";
      path = fetchurl {
        name = "xmlchars___xmlchars_2.2.0.tgz";
        url  = "https://registry.yarnpkg.com/xmlchars/-/xmlchars-2.2.0.tgz";
        sha1 = "060fe1bcb7f9c76fe2a17db86a9bc3ab894210cb";
      };
    }
    {
      name = "xtend___xtend_4.0.2.tgz";
      path = fetchurl {
        name = "xtend___xtend_4.0.2.tgz";
        url  = "https://registry.yarnpkg.com/xtend/-/xtend-4.0.2.tgz";
        sha1 = "bb72779f5fa465186b1f438f674fa347fdb5db54";
      };
    }
    {
      name = "y18n___y18n_3.2.1.tgz";
      path = fetchurl {
        name = "y18n___y18n_3.2.1.tgz";
        url  = "https://registry.yarnpkg.com/y18n/-/y18n-3.2.1.tgz";
        sha1 = "6d15fba884c08679c0d77e88e7759e811e07fa41";
      };
    }
    {
      name = "y18n___y18n_4.0.0.tgz";
      path = fetchurl {
        name = "y18n___y18n_4.0.0.tgz";
        url  = "https://registry.yarnpkg.com/y18n/-/y18n-4.0.0.tgz";
        sha1 = "95ef94f85ecc81d007c264e190a120f0a3c8566b";
      };
    }
    {
      name = "y18n___y18n_5.0.5.tgz";
      path = fetchurl {
        name = "y18n___y18n_5.0.5.tgz";
        url  = "https://registry.yarnpkg.com/y18n/-/y18n-5.0.5.tgz";
        sha1 = "8769ec08d03b1ea2df2500acef561743bbb9ab18";
      };
    }
    {
      name = "yallist___yallist_2.1.2.tgz";
      path = fetchurl {
        name = "yallist___yallist_2.1.2.tgz";
        url  = "https://registry.yarnpkg.com/yallist/-/yallist-2.1.2.tgz";
        sha1 = "1c11f9218f076089a47dd512f93c6699a6a81d52";
      };
    }
    {
      name = "yaml___yaml_1.9.2.tgz";
      path = fetchurl {
        name = "yaml___yaml_1.9.2.tgz";
        url  = "https://registry.yarnpkg.com/yaml/-/yaml-1.9.2.tgz";
        sha1 = "f0cfa865f003ab707663e4f04b3956957ea564ed";
      };
    }
    {
      name = "yargs_parser___yargs_parser_15.0.1.tgz";
      path = fetchurl {
        name = "yargs_parser___yargs_parser_15.0.1.tgz";
        url  = "https://registry.yarnpkg.com/yargs-parser/-/yargs-parser-15.0.1.tgz";
        sha1 = "54786af40b820dcb2fb8025b11b4d659d76323b3";
      };
    }
    {
      name = "yargs_parser___yargs_parser_18.1.3.tgz";
      path = fetchurl {
        name = "yargs_parser___yargs_parser_18.1.3.tgz";
        url  = "https://registry.yarnpkg.com/yargs-parser/-/yargs-parser-18.1.3.tgz";
        sha1 = "be68c4975c6b2abf469236b0c870362fab09a7b0";
      };
    }
    {
      name = "yargs_parser___yargs_parser_20.2.3.tgz";
      path = fetchurl {
        name = "yargs_parser___yargs_parser_20.2.3.tgz";
        url  = "https://registry.yarnpkg.com/yargs-parser/-/yargs-parser-20.2.3.tgz";
        sha1 = "92419ba867b858c868acf8bae9bf74af0dd0ce26";
      };
    }
    {
      name = "yargs_parser___yargs_parser_9.0.2.tgz";
      path = fetchurl {
        name = "yargs_parser___yargs_parser_9.0.2.tgz";
        url  = "https://registry.yarnpkg.com/yargs-parser/-/yargs-parser-9.0.2.tgz";
        sha1 = "9ccf6a43460fe4ed40a9bb68f48d43b8a68cc077";
      };
    }
    {
      name = "yargs___yargs_11.1.1.tgz";
      path = fetchurl {
        name = "yargs___yargs_11.1.1.tgz";
        url  = "https://registry.yarnpkg.com/yargs/-/yargs-11.1.1.tgz";
        sha1 = "5052efe3446a4df5ed669c995886cc0f13702766";
      };
    }
    {
      name = "yargs___yargs_14.2.3.tgz";
      path = fetchurl {
        name = "yargs___yargs_14.2.3.tgz";
        url  = "https://registry.yarnpkg.com/yargs/-/yargs-14.2.3.tgz";
        sha1 = "1a1c3edced1afb2a2fea33604bc6d1d8d688a414";
      };
    }
    {
      name = "yargs___yargs_15.3.1.tgz";
      path = fetchurl {
        name = "yargs___yargs_15.3.1.tgz";
        url  = "https://registry.yarnpkg.com/yargs/-/yargs-15.3.1.tgz";
        sha1 = "9505b472763963e54afe60148ad27a330818e98b";
      };
    }
    {
      name = "yargs___yargs_16.0.3.tgz";
      path = fetchurl {
        name = "yargs___yargs_16.0.3.tgz";
        url  = "https://registry.yarnpkg.com/yargs/-/yargs-16.0.3.tgz";
        sha1 = "7a919b9e43c90f80d4a142a89795e85399a7e54c";
      };
    }
    {
      name = "zen_observable_ts___zen_observable_ts_0.8.21.tgz";
      path = fetchurl {
        name = "zen_observable_ts___zen_observable_ts_0.8.21.tgz";
        url  = "https://registry.yarnpkg.com/zen-observable-ts/-/zen-observable-ts-0.8.21.tgz";
        sha1 = "85d0031fbbde1eba3cd07d3ba90da241215f421d";
      };
    }
    {
      name = "zen_observable___zen_observable_0.8.15.tgz";
      path = fetchurl {
        name = "zen_observable___zen_observable_0.8.15.tgz";
        url  = "https://registry.yarnpkg.com/zen-observable/-/zen-observable-0.8.15.tgz";
        sha1 = "96415c512d8e3ffd920afd3889604e30b9eaac15";
      };
    }
  ];
}
