import { defineEcConfig } from 'astro-expressive-code'

// Custom language definitions for missing languages in TextMate grammar format
const customLanguages = [
  // Rego (Open Policy Agent)
  {
    name: 'rego',
    scopeName: 'source.rego',
    aliases: ['opa'],
    patterns: [
      {
        name: 'comment.line.number-sign.rego',
        match: '#.*$'
      },
      {
        name: 'keyword.control.rego',
        match: '\\b(package|import|as|default|not|with|else|some|input|data)\\b'
      },
      {
        name: 'keyword.operator.rego',
        match: '(:=|==|!=|<|>|<=|>=|\\+|-|\\*|/|%|&|\\||!)'
      },
      {
        name: 'string.quoted.double.rego',
        begin: '"',
        end: '"',
        patterns: [
          {
            name: 'constant.character.escape.rego',
            match: '\\\\.'
          }
        ]
      },
      {
        name: 'constant.numeric.rego',
        match: '\\b\\d+\\b'
      },
      {
        name: 'constant.language.rego',
        match: '\\b(true|false|null)\\b'
      }
    ]
  },
  
  // DNS Zone files
  {
    name: 'dns',
    scopeName: 'text.dns',
    aliases: ['zone', 'bind'],
    patterns: [
      {
        name: 'comment.line.semicolon.dns',
        match: ';.*$'
      },
      {
        name: 'keyword.control.dns',
        match: '\\$ORIGIN|\\$TTL|\\$INCLUDE|\\$GENERATE'
      },
      {
        name: 'support.type.dns',
        match: '\\b(IN|CS|CH|HS)\\b'
      },
      {
        name: 'support.class.dns',
        match: '\\b(A|AAAA|CNAME|MX|NS|PTR|SOA|TXT|SRV|CAA|DNSKEY|DS|RRSIG|SPF|DKIM|DMARC)\\b'
      },
      {
        name: 'constant.numeric.dns',
        match: '\\b\\d+\\b'
      },
      {
        name: 'string.quoted.double.dns',
        begin: '"',
        end: '"'
      }
    ]
  },
  
  // CoreDNS Corefile
  {
    name: 'corefile',
    scopeName: 'source.corefile',
    aliases: ['coredns'],
    patterns: [
      {
        name: 'comment.line.number-sign.corefile',
        match: '#.*$'
      },
      {
        name: 'entity.name.section.corefile',
        match: '^[a-zA-Z0-9.:\\-]+(?=\\s*{)'
      },
      {
        name: 'support.function.corefile',
        match: '\\b(forward|cache|log|errors|health|ready|prometheus|hosts|file|auto|reload|loadbalance|loop|bind|dnssec|metrics|tls|grpc|etcd|kubernetes|route53|rewrite|template|transfer|acl|any|chaos|debug|dns64|dnstap|erratic|federation|firewall|geoip|header|metadata|nsid|pprof|redisc|root|secondary|sign|trace|whoami)\\b'
      },
      {
        name: 'string.quoted.double.corefile',
        begin: '"',
        end: '"'
      },
      {
        name: 'constant.numeric.corefile',
        match: '\\b\\d+\\b'
      }
    ]
  },
  
  // Generic configuration files
  {
    name: 'conf',
    scopeName: 'source.conf',
    aliases: ['config', 'cfg'],
    patterns: [
      {
        name: 'comment.line.number-sign.conf',
        match: '#.*$'
      },
      {
        name: 'comment.line.semicolon.conf',
        match: ';.*$'
      },
      {
        name: 'variable.other.conf',
        match: '^[a-zA-Z_][a-zA-Z0-9_]*(?=\\s*[=:])'
      },
      {
        name: 'keyword.operator.assignment.conf',
        match: '[=:]'
      },
      {
        name: 'string.quoted.double.conf',
        begin: '"',
        end: '"',
        patterns: [
          {
            name: 'constant.character.escape.conf',
            match: '\\\\.'
          }
        ]
      },
      {
        name: 'string.quoted.single.conf',
        begin: "'",
        end: "'"
      },
      {
        name: 'constant.numeric.conf',
        match: '\\b\\d+(\\.\\d+)?\\b'
      },
      {
        name: 'constant.language.conf',
        match: '\\b(true|false|yes|no|on|off|enabled|disabled)\\b'
      }
    ]
  },
  
  // Prometheus configuration
  {
    name: 'prometheus',
    scopeName: 'source.prometheus',
    patterns: [
      {
        name: 'comment.line.number-sign.prometheus',
        match: '#.*$'
      },
      {
        name: 'keyword.control.prometheus',
        match: '\\b(global|scrape_configs|job_name|static_configs|targets|labels|scrape_interval|scrape_timeout|evaluation_interval|external_labels|alerting|alertmanagers|rule_files|remote_write|remote_read)\\b'
      },
      {
        name: 'string.quoted.double.prometheus',
        begin: '"',
        end: '"'
      },
      {
        name: 'string.quoted.single.prometheus',
        begin: "'",
        end: "'"
      },
      {
        name: 'constant.numeric.prometheus',
        match: '\\b\\d+(\\.\\d+)?([smhd])?\\b'
      }
    ]
  },
  
  // PromQL (Prometheus Query Language)
  {
    name: 'promql',
    scopeName: 'source.promql',
    aliases: ['prometheus-query'],
    patterns: [
      {
        name: 'comment.line.number-sign.promql',
        match: '#.*$'
      },
      {
        name: 'keyword.control.promql',
        match: '\\b(by|without|on|ignoring|group_left|group_right|offset|bool)\\b'
      },
      {
        name: 'support.function.promql',
        match: '\\b(sum|min|max|avg|count|stddev|stdvar|bottomk|topk|quantile|rate|irate|increase|delta|deriv|predict_linear|histogram_quantile|changes|resets|absent|sqrt|exp|ln|abs|ceil|floor|round|vector|scalar|time|timestamp|label_replace|label_join)\\b'
      },
      {
        name: 'keyword.operator.promql',
        match: '(==|!=|>|<|>=|<=|=~|!~|\\+|-|\\*|/|%|\\^|and|or|unless)'
      },
      {
        name: 'string.quoted.double.promql',
        begin: '"',
        end: '"'
      },
      {
        name: 'constant.numeric.promql',
        match: '\\b\\d+(\\.\\d+)?([eE][+-]?\\d+)?[smhdwy]?\\b'
      }
    ]
  },
  
  // Icinga 2 configuration
  {
    name: 'icinga2',
    scopeName: 'source.icinga2',
    aliases: ['icinga'],
    patterns: [
      {
        name: 'comment.line.double-slash.icinga2',
        match: '//.*$'
      },
      {
        name: 'comment.block.icinga2',
        begin: '/\\*',
        end: '\\*/'
      },
      {
        name: 'keyword.control.icinga2',
        match: '\\b(object|template|apply|import|include|library|const|var|if|else|for|while|return|break|continue|function|in|to|where|ignore|using|globals|locals|this|use|default|ignore_on_error|required|skip_key|navigation|types|len|union|intersection|keys|string|number|bool|log|match|cidr_match|range|exit|random|macro|typeof|throw|try|except)\\b'
      },
      {
        name: 'support.type.icinga2',
        match: '\\b(Host|Service|CheckCommand|NotificationCommand|EventCommand|User|UserGroup|TimePeriod|ScheduledDowntime|Dependency|Notification|ApiUser|ApiListener|CheckerComponent|CompatLogger|ElasticsearchWriter|ExternalCommandListener|FileLogger|GelfWriter|GraphiteWriter|IcingaDB|IdoMysqlConnection|IdoPgsqlConnection|InfluxdbWriter|LivestatusListener|NotificationComponent|OpenTsdbWriter|PerfdataWriter|StatusDataWriter|SyslogLogger|Zone|Endpoint|Comment|Downtime)\\b'
      },
      {
        name: 'string.quoted.double.icinga2',
        begin: '"',
        end: '"',
        patterns: [
          {
            name: 'constant.character.escape.icinga2',
            match: '\\\\.'
          }
        ]
      },
      {
        name: 'constant.numeric.icinga2',
        match: '\\b\\d+(\\.\\d+)?[smhd]?\\b'
      },
      {
        name: 'constant.language.icinga2',
        match: '\\b(true|false|null)\\b'
      }
    ]
  },
  
  // SELinux Type Enforcement (te)
  {
    name: 'te',
    scopeName: 'source.te',
    aliases: ['selinux'],
    patterns: [
      {
        name: 'comment.line.number-sign.te',
        match: '#.*$'
      },
      {
        name: 'keyword.control.te',
        match: '\\b(module|require|type|attribute|alias|class|role|user|bool|if|else|ifdef|ifndef|define|gen_require|optional|policy_module|interface|template|tunable|gen_tunable)\\b'
      },
      {
        name: 'support.function.te',
        match: '\\b(allow|dontaudit|auditallow|neverallow|type_transition|type_change|type_member|range_transition|role_transition|constrain|validatetrans|mlsconstrain|mlsvalidatetrans)\\b'
      },
      {
        name: 'string.quoted.double.te',
        begin: '"',
        end: '"'
      },
      {
        name: 'constant.language.te',
        match: '\\b(self|source|target|u1|u2|u3|r1|r2|r3|t1|t2|t3|l1|l2|h1|h2)\\b'
      }
    ]
  },
  
  // AppArmor profiles
  {
    name: 'apparmor',
    scopeName: 'source.apparmor',
    patterns: [
      {
        name: 'comment.line.number-sign.apparmor',
        match: '#.*$'
      },
      {
        name: 'keyword.control.apparmor',
        match: '\\b(profile|flags|include|if|defined|capability|network|mount|umount|pivot_root|ptrace|signal|dbus|unix|file|owner|audit|deny|link|alias|rewrite|abi|set|tunables)\\b'
      },
      {
        name: 'keyword.operator.apparmor',
        match: '\\b(r|w|x|k|l|m|ix|ux|Ux|px|Px|cx|Cx|pix|Pix|cix|Cix|pux|PUx|cux|CUx)\\b'
      },
      {
        name: 'string.quoted.double.apparmor',
        begin: '"',
        end: '"'
      },
      {
        name: 'variable.other.apparmor',
        match: '@{[A-Z_]+}'
      },
      {
        name: 'string.other.apparmor',
        match: '<[^>]+>'
      }
    ]
  },
  
  // TOMOYO Linux
  {
    name: 'tomoyo',
    scopeName: 'source.tomoyo',
    patterns: [
      {
        name: 'comment.line.number-sign.tomoyo',
        match: '#.*$'
      },
      {
        name: 'keyword.control.tomoyo',
        match: '\\b(allow_read|allow_write|allow_execute|allow_read_write|allow_create|allow_unlink|allow_mkdir|allow_rmdir|allow_mkfifo|allow_mksock|allow_mkblock|allow_mkchar|allow_truncate|allow_symlink|allow_link|allow_rename|allow_rewrite|allow_chmod|allow_chown|allow_chgrp|allow_ioctl|allow_mount|allow_unmount|allow_chroot|allow_pivot_root|initialize_domain|no_initialize_domain|keep_domain|no_keep_domain|file_pattern|path_group|number_group|address_group|aggregator|deny_autobind|deny_rewrite)\\b'
      },
      {
        name: 'string.quoted.double.tomoyo',
        begin: '"',
        end: '"'
      }
    ]
  },
  
  // fstab file format
  {
    name: 'fstab',
    scopeName: 'source.fstab',
    patterns: [
      {
        name: 'comment.line.number-sign.fstab',
        match: '#.*$'
      },
      {
        name: 'support.type.filesystem.fstab',
        match: '\\b(ext2|ext3|ext4|xfs|btrfs|vfat|ntfs|ntfs-3g|swap|proc|sysfs|devpts|tmpfs|nfs|nfs4|cifs|auto|none|f2fs|jfs|reiserfs|udf|iso9660|squashfs|aufs|overlay|fuse)\\b'
      },
      {
        name: 'keyword.other.fstab',
        match: '\\b(defaults|auto|noauto|user|nouser|users|exec|noexec|ro|rw|sync|async|dev|nodev|suid|nosuid|relatime|noatime|nodiratime|errors|remount-ro|usrquota|grpquota|uid|gid|umask|dmask|fmask|_netdev|nofail|x-systemd)\\b'
      },
      {
        name: 'constant.numeric.fstab',
        match: '\\b\\d+\\b'
      },
      {
        name: 'support.constant.fstab',
        match: '\\b(UUID|LABEL|PARTUUID|PARTLABEL)='
      }
    ]
  },
  
  // Jinja2 templates
  {
    name: 'jinja2',
    scopeName: 'source.jinja2',
    aliases: ['jinja', 'j2'],
    patterns: [
      {
        name: 'comment.block.jinja2',
        begin: '{#',
        end: '#}'
      },
      {
        name: 'meta.tag.template.jinja2',
        begin: '{%-?',
        end: '-?%}',
        patterns: [
          {
            name: 'keyword.control.flow.jinja2',
            match: '\\b(if|elif|else|endif|for|endfor|while|endwhile|break|continue|block|endblock|extends|include|import|from|as|with|endwith|macro|endmacro|call|endcall|filter|endfilter|set|endset|raw|endraw|do|pluralize|trans|endtrans|autoescape|endautoescape)\\b'
          },
          {
            name: 'keyword.operator.jinja2',
            match: '\\b(in|is|and|or|not|recursive|scoped|required)\\b'
          }
        ]
      },
      {
        name: 'meta.tag.expression.jinja2',
        begin: '{{-?',
        end: '-?}}',
        patterns: [
          {
            name: 'support.function.jinja2',
            match: '\\b(abs|attr|batch|capitalize|center|default|dictsort|escape|filesizeformat|first|float|forceescape|format|groupby|indent|int|join|last|length|list|lower|map|max|min|pprint|random|reject|rejectattr|replace|reverse|round|safe|select|selectattr|slice|sort|string|striptags|sum|title|trim|truncate|unique|upper|urlencode|urlize|wordcount|wordwrap|xmlattr|tojson|tojson_pretty)\\b'
          },
          {
            name: 'support.function.test.jinja2',
            match: '\\b(callable|defined|divisibleby|equalto|escaped|even|ge|gt|in|iterable|le|lower|lt|mapping|ne|none|number|odd|sameas|sequence|string|undefined|upper)\\b'
          }
        ]
      },
      {
        name: 'string.quoted.double.jinja2',
        begin: '"',
        end: '"',
        patterns: [
          {
            name: 'constant.character.escape.jinja2',
            match: '\\\\.'
          }
        ]
      },
      {
        name: 'string.quoted.single.jinja2',
        begin: "'",
        end: "'",
        patterns: [
          {
            name: 'constant.character.escape.jinja2',
            match: '\\\\.'
          }
        ]
      }
    ]
  },
  
  // jq (JSON query language)
  {
    name: 'jq',
    scopeName: 'source.jq',
    patterns: [
      { name: 'comment.line.number-sign.jq', match: '#.*$' },
      { name: 'keyword.control.jq', match: '\\b(if|then|else|elif|end|try|catch|reduce|foreach|label|break|as|import|include|module|def)\\b' },
      { name: 'support.function.jq', match: '\\b(length|utf8bytelength|keys|keys_unsorted|values|has|in|map|map_values|to_entries|from_entries|with_entries|any|all|flatten|range|floor|ceil|round|sqrt|fabs|nan|infinite|isinfinite|isnan|isnormal|isfinite|sort|sort_by|group_by|unique|unique_by|reverse|contains|inside|startswith|endswith|split|join|ltrimstr|rtrimstr|ascii_downcase|ascii_upcase|test|match|capture|scan|sub|gsub|indices|index|rindex|tojson|fromjson|ascii|explode|implode|tonumber|tostring|type|infinite|nan|not|paths|leaf_paths|path|getpath|setpath|delpaths|to_json|from_json|recurse|env|input|inputs|debug|error|stderr|halt|halt_error|empty|add|del|limit|first|last|nth|while|until|recurse_down|walk|getpath|leaf_path|isvalid|input|modulemeta|builtins|ascii|indices|inside|contains|min|max|min_by|max_by|bsearch|ascii|tojson|fromjson|format|@text|@json|@html|@csv|@tsv|@sh|@base32|@base32d|@base64|@base64d|@uri)\\b' },
      { name: 'keyword.operator.jq', match: '(\\.\\.\\.|\\.\\.|\\.\\[|\\||,|;|:|//=|//|\\?//|\\+=|-=|\\*=|/=|%=|==|!=|<=|>=|<|>|not|\\?|\\*|/|%|\\+|-)' },
      { name: 'string.quoted.double.jq', begin: '"', end: '"', patterns: [{ name: 'variable.other.jq', match: '\\\\\\(.*?\\)' }, { name: 'constant.character.escape.jq', match: '\\\\.' }] },
      { name: 'constant.numeric.jq', match: '-?\\b\\d+(\\.\\d+)?([eE][+-]?\\d+)?\\b' },
      { name: 'constant.language.jq', match: '\\b(true|false|null)\\b' },
      { name: 'variable.language.jq', match: '\\$[a-zA-Z_][a-zA-Z0-9_]*' },
    ]
  },

  // VCL (Varnish Configuration Language)
  {
    name: 'vcl',
    scopeName: 'source.vcl',
    patterns: [
      { name: 'comment.line.double-slash.vcl', match: '//.*$' },
      { name: 'comment.block.vcl', begin: '/\\*', end: '\\*/' },
      { name: 'comment.line.number-sign.vcl', match: '#.*$' },
      { name: 'keyword.control.vcl', match: '\\b(vcl|acl|backend|director|import|include|new|probe|sub|call|error|pass|pipe|hash|deliver|fetch|recv|hit|miss|hash|purge|synth|restart|retry|return|set|unset|if|elsif|else|switch|case|default|for|break|continue|rollback|declare|local|bereq|beresp|req|resp|obj|client|server|storage)\\b' },
      { name: 'support.function.vcl', match: '\\b(ban|regsuball|regsub|hash_data|synthetic|new|call|return|set|unset|synth|bereq\\.http\\.|beresp\\.http\\.|req\\.http\\.|resp\\.http\\.)' },
      { name: 'string.quoted.double.vcl', begin: '"', end: '"', patterns: [{ name: 'constant.character.escape.vcl', match: '\\\\.' }] },
      { name: 'string.other.long.vcl', begin: '{"', end: '"}' },
      { name: 'constant.numeric.vcl', match: '\\b\\d+(\\.\\d+)?(m|s|ms|h|d|w|y)?\\b' },
      { name: 'constant.language.vcl', match: '\\b(true|false)\\b' },
      { name: 'variable.other.vcl', match: '\\b(bereq|beresp|req|resp|obj|client|server|storage|now|local|remote|identity)\\b' },
    ]
  },

  // Caddyfile
  {
    name: 'caddyfile',
    scopeName: 'source.caddyfile',
    aliases: ['caddy'],
    patterns: [
      {
        name: 'comment.line.number-sign.caddyfile',
        match: '#.*$'
      },
      {
        name: 'entity.name.tag.caddyfile',
        match: '^[a-zA-Z0-9.:*\\-]+(?=\\s*{)'
      },
      {
        name: 'keyword.control.directive.caddyfile',
        match: '\\b(import|snippet|respond|reverse_proxy|file_server|php_fastcgi|encode|header|rewrite|redir|try_files|root|tls|log|basicauth|jwt|rate_limit|cache|cors|handle|handle_path|handle_errors|route|matcher|not|path|method|host|remote_ip|query|header_regexp|path_regexp|vars|vars_regexp|expression|file|dir)\\b'
      },
      {
        name: 'support.type.matcher.caddyfile',
        match: '@[a-zA-Z_][a-zA-Z0-9_]*'
      },
      {
        name: 'string.quoted.double.caddyfile',
        begin: '"',
        end: '"',
        patterns: [
          {
            name: 'constant.character.escape.caddyfile',
            match: '\\\\.'
          }
        ]
      },
      {
        name: 'string.quoted.backtick.caddyfile',
        begin: '`',
        end: '`'
      },
      {
        name: 'constant.numeric.caddyfile',
        match: '\\b\\d+[kmg]?b?\\b'
      },
      {
        name: 'variable.other.placeholder.caddyfile',
        match: '{[^}]+}'
      }
    ]
  }
];

export default defineEcConfig({
  shiki: {
    langs: customLanguages
  }
});