#!/usr/bin/env python3
"""
Wazuh Rule Syntax Validator
===========================

Comprehensive syntax validation for Wazuh correlation rules.
Checks XML structure, rule elements, and Wazuh-specific requirements.
"""

import xml.etree.ElementTree as ET
import re
import logging
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass

@dataclass
class SyntaxError:
    """Represents a syntax validation error"""
    severity: str  # 'error', 'warning', 'info'
    message: str
    line_number: Optional[int] = None
    element: Optional[str] = None
    suggestion: Optional[str] = None

class WazuhSyntaxValidator:
    """Advanced syntax validator for Wazuh rules"""
    
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.info = []
        
        # Wazuh rule element validation rules
        self.required_elements = {
            'rule': ['id'],  # rule must have id attribute
            'description': [],  # description is required
        }
        
        self.optional_elements = {
            'regex', 'match', 'decoded_as', 'category', 'srcip', 'dstip',
            'user', 'url', 'id', 'data', 'extra_data', 'status', 'hostname',
            'program_name', 'tag', 'field', 'options', 'info', 'group',
            'if_sid', 'if_group', 'if_level', 'if_matched_sid', 'same_id',
            'different_id', 'not_same_id', 'frequency', 'timeframe',
            'ignore', 'check_diff', 'action'
        }
        
        self.attribute_rules = {
            'rule': {
                'required': ['id'],
                'optional': ['level', 'maxsize', 'frequency', 'timeframe', 'ignore', 'overwrite']
            },
            'field': {
                'required': ['name'],
                'optional': ['type', 'regex']
            },
            'regex': {
                'optional': ['offset', 'order']
            }
        }
        
        # Common regex patterns that might cause performance issues
        self.problematic_patterns = [
            r'\.\*\.\*',  # .*.*
            r'\.\+\.\+',  # .+.+
            r'\(\.\*\)\+',  # (.*)+ 
            r'\(\.\+\)\+',  # (.+)+
        ]
    
    def validate_rule(self, rule_content: str) -> Dict[str, any]:
        """
        Comprehensive validation of a Wazuh rule
        
        Args:
            rule_content: XML string containing the Wazuh rule
            
        Returns:
            Dict containing validation results
        """
        self.errors = []
        self.warnings = []
        self.info = []
        
        # Basic XML validation
        try:
            root = ET.fromstring(rule_content)
        except ET.ParseError as e:
            self.errors.append(SyntaxError(
                severity='error',
                message=f"XML parsing error: {str(e)}",
                suggestion="Fix XML syntax errors"
            ))
            return self._compile_results()
        
        # Validate rule structure
        self._validate_rule_structure(root)
        
        # Validate rule attributes
        self._validate_rule_attributes(root)
        
        # Validate rule elements
        self._validate_rule_elements(root)
        
        # Validate regex patterns
        self._validate_regex_patterns(root)
        
        # Validate field references
        self._validate_field_references(root)
        
        # Check for performance issues
        self._check_performance_issues(root, rule_content)
        
        # Validate rule logic
        self._validate_rule_logic(root)
        
        # Check for security best practices
        self._check_security_practices(root)
        
        return self._compile_results()
    
    def _validate_rule_structure(self, root: ET.Element):
        """Validate basic rule structure"""
        
        # Check if root element is 'rule' or contains 'rule'
        if root.tag != 'rule':
            rule_elem = root.find('.//rule')
            if rule_elem is None:
                self.errors.append(SyntaxError(
                    severity='error',
                    message="No <rule> element found",
                    suggestion="Wrap rule content in <rule> tags"
                ))
                return
            root = rule_elem
        
        # Check for required elements
        description = root.find('description')
        if description is None:
            self.errors.append(SyntaxError(
                severity='error',
                message="Missing required <description> element",
                element='description',
                suggestion="Add a <description> element to explain what the rule detects"
            ))
        
        # Check for at least one matching condition
        matching_elements = ['regex', 'match', 'decoded_as', 'srcip', 'dstip', 'user']
        has_matching_condition = any(root.find(elem) is not None for elem in matching_elements)
        
        if not has_matching_condition:
            self.warnings.append(SyntaxError(
                severity='warning',
                message="No matching conditions found",
                suggestion="Add at least one matching condition (regex, match, decoded_as, etc.)"
            ))
    
    def _validate_rule_attributes(self, root: ET.Element):
        """Validate rule attributes"""
        
        rule_elem = root if root.tag == 'rule' else root.find('.//rule')
        if rule_elem is None:
            return
        
        # Validate rule ID
        rule_id = rule_elem.get('id')
        if not rule_id:
            self.errors.append(SyntaxError(
                severity='error',
                message="Missing required 'id' attribute in <rule>",
                element='rule',
                suggestion="Add id attribute: <rule id=\"100001\">"
            ))
        else:
            # Validate ID format
            if not rule_id.isdigit():
                self.errors.append(SyntaxError(
                    severity='error',
                    message=f"Rule ID '{rule_id}' must be numeric",
                    element='rule',
                    suggestion="Use numeric ID like: id=\"100001\""
                ))
            else:
                id_num = int(rule_id)
                if id_num < 1 or id_num > 999999:
                    self.warnings.append(SyntaxError(
                        severity='warning',
                        message=f"Rule ID {rule_id} outside recommended range (1-999999)",
                        element='rule',
                        suggestion="Use ID in range 100000-199999 for custom rules"
                    ))
        
        # Validate level attribute
        level = rule_elem.get('level')
        if level:
            try:
                level_num = int(level)
                if level_num < 0 or level_num > 15:
                    self.warnings.append(SyntaxError(
                        severity='warning',
                        message=f"Rule level {level} outside valid range (0-15)",
                        element='rule',
                        suggestion="Use level 0-15 (0=debug, 3=info, 5=notice, 7=warning, 10=error, 12=critical)"
                    ))
            except ValueError:
                self.errors.append(SyntaxError(
                    severity='error',
                    message=f"Rule level '{level}' must be numeric",
                    element='rule',
                    suggestion="Use numeric level like: level=\"5\""
                ))
        
        # Validate frequency and timeframe
        frequency = rule_elem.get('frequency')
        timeframe = rule_elem.get('timeframe')
        
        if frequency and not timeframe:
            self.warnings.append(SyntaxError(
                severity='warning',
                message="Frequency specified without timeframe",
                element='rule',
                suggestion="Add timeframe attribute when using frequency"
            ))
        
        if timeframe and not frequency:
            self.warnings.append(SyntaxError(
                severity='warning',
                message="Timeframe specified without frequency",
                element='rule',
                suggestion="Add frequency attribute when using timeframe"
            ))
    
    def _validate_rule_elements(self, root: ET.Element):
        """Validate individual rule elements"""
        
        for elem in root.iter():
            if elem.tag not in self.optional_elements and elem.tag not in self.required_elements:
                if elem.tag != 'rule':  # Skip root rule element
                    self.warnings.append(SyntaxError(
                        severity='warning',
                        message=f"Unknown element: <{elem.tag}>",
                        element=elem.tag,
                        suggestion="Check Wazuh documentation for valid elements"
                    ))
        
        # Validate field elements
        for field in root.findall('.//field'):
            name = field.get('name')
            if not name:
                self.errors.append(SyntaxError(
                    severity='error',
                    message="Field element missing 'name' attribute",
                    element='field',
                    suggestion="Add name attribute: <field name=\"srcip\">"
                ))
            
            # Check if field has content or regex attribute
            if not field.text and not field.get('regex'):
                self.warnings.append(SyntaxError(
                    severity='warning',
                    message=f"Field '{name}' has no content or regex",
                    element='field',
                    suggestion="Add field content or regex attribute"
                ))
    
    def _validate_regex_patterns(self, root: ET.Element):
        """Validate regex patterns for syntax and performance"""
        
        regex_elements = root.findall('.//regex')
        
        for regex_elem in regex_elements:
            pattern = regex_elem.text
            if not pattern:
                self.warnings.append(SyntaxError(
                    severity='warning',
                    message="Empty regex pattern",
                    element='regex',
                    suggestion="Add regex pattern content"
                ))
                continue
            
            # Test regex compilation
            try:
                re.compile(pattern)
            except re.error as e:
                self.errors.append(SyntaxError(
                    severity='error',
                    message=f"Invalid regex pattern: {str(e)}",
                    element='regex',
                    suggestion="Fix regex syntax"
                ))
                continue
            
            # Check for problematic patterns
            for problematic in self.problematic_patterns:
                if re.search(problematic, pattern):
                    self.warnings.append(SyntaxError(
                        severity='warning',
                        message=f"Potentially slow regex pattern: {pattern}",
                        element='regex',
                        suggestion="Consider more specific patterns to improve performance"
                    ))
            
            # Check for overly broad patterns
            if pattern in ['.*', '.+', '.*.*', '.+.+']:
                self.warnings.append(SyntaxError(
                    severity='warning',
                    message=f"Overly broad regex pattern: {pattern}",
                    element='regex',
                    suggestion="Use more specific patterns to reduce false positives"
                ))
            
            # Check for unescaped special characters in likely literal strings
            if any(char in pattern for char in ['.', '*', '+', '?', '^', '$']) and pattern.count('\\') == 0:
                if not any(regex_char in pattern for regex_char in ['[', ']', '(', ')', '|']):
                    self.info.append(SyntaxError(
                        severity='info',
                        message=f"Pattern may need escaping: {pattern}",
                        element='regex',
                        suggestion="Escape special characters if they should be literal"
                    ))
    
    def _validate_field_references(self, root: ET.Element):
        """Validate field references"""
        
        field_elements = root.findall('.//field')
        
        # Common Wazuh field names
        common_fields = {
            'srcip', 'dstip', 'srcport', 'dstport', 'protocol', 'user', 'url',
            'hostname', 'program_name', 'systemname', 'processname', 'id',
            'status', 'action', 'extra_data', 'data', 'location'
        }
        
        for field in field_elements:
            field_name = field.get('name')
            if field_name and field_name not in common_fields:
                self.info.append(SyntaxError(
                    severity='info',
                    message=f"Custom field name: {field_name}",
                    element='field',
                    suggestion="Verify field name is available in your log format"
                ))
    
    def _check_performance_issues(self, root: ET.Element, rule_content: str):
        """Check for potential performance issues"""
        
        # Count regex elements
        regex_count = len(root.findall('.//regex'))
        if regex_count > 5:
            self.warnings.append(SyntaxError(
                severity='warning',
                message=f"High number of regex patterns ({regex_count})",
                suggestion="Consider consolidating patterns for better performance"
            ))
        
        # Check for nested conditions
        if_elements = root.findall('.//if_sid') + root.findall('.//if_group') + root.findall('.//if_level')
        if len(if_elements) > 3:
            self.warnings.append(SyntaxError(
                severity='warning',
                message="Complex conditional logic detected",
                suggestion="Simplify rule conditions for better maintainability"
            ))
        
        # Check rule content length
        if len(rule_content) > 2000:
            self.warnings.append(SyntaxError(
                severity='warning',
                message="Very long rule definition",
                suggestion="Consider breaking into multiple simpler rules"
            ))
    
    def _validate_rule_logic(self, root: ET.Element):
        """Validate rule logic consistency"""
        
        # Check for conflicting conditions
        if_sid = root.find('.//if_sid')
        if_group = root.find('.//if_group')
        
        if if_sid is not None and if_group is not None:
            self.info.append(SyntaxError(
                severity='info',
                message="Rule uses both if_sid and if_group",
                suggestion="Verify this combination is intentional"
            ))
        
        # Check frequency rules
        frequency = root.find('.//frequency')
        timeframe = root.find('.//timeframe')
        
        if frequency is not None:
            try:
                freq_val = int(frequency.text)
                if freq_val < 2:
                    self.warnings.append(SyntaxError(
                        severity='warning',
                        message="Frequency less than 2 may not work as expected",
                        element='frequency',
                        suggestion="Use frequency >= 2 for correlation rules"
                    ))
            except (ValueError, TypeError):
                self.errors.append(SyntaxError(
                    severity='error',
                    message="Invalid frequency value",
                    element='frequency',
                    suggestion="Use numeric value for frequency"
                ))
        
        if timeframe is not None:
            try:
                time_val = int(timeframe.text)
                if time_val < 1:
                    self.errors.append(SyntaxError(
                        severity='error',
                        message="Timeframe must be positive",
                        element='timeframe',
                        suggestion="Use positive seconds for timeframe"
                    ))
                elif time_val > 86400:  # 24 hours
                    self.warnings.append(SyntaxError(
                        severity='warning',
                        message="Very long timeframe (>24 hours)",
                        element='timeframe',
                        suggestion="Consider shorter timeframes for better performance"
                    ))
            except (ValueError, TypeError):
                self.errors.append(SyntaxError(
                    severity='error',
                    message="Invalid timeframe value",
                    element='timeframe',
                    suggestion="Use numeric seconds for timeframe"
                ))
    
    def _check_security_practices(self, root: ET.Element):
        """Check for security best practices"""
        
        # Check for hardcoded IP addresses
        for elem in root.iter():
            if elem.text:
                # Simple IP pattern check
                ip_pattern = r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b'
                if re.search(ip_pattern, elem.text):
                    # Exclude common safe IPs
                    safe_ips = ['127.0.0.1', '0.0.0.0', '255.255.255.255']
                    if not any(safe_ip in elem.text for safe_ip in safe_ips):
                        self.info.append(SyntaxError(
                            severity='info',
                            message=f"Hardcoded IP address detected: {elem.text}",
                            element=elem.tag,
                            suggestion="Consider using IP ranges or variables for flexibility"
                        ))
        
        # Check for overly permissive rules
        level = root.get('level')
        if level and int(level) < 3:
            regex_elements = root.findall('.//regex')
            if any(elem.text in ['.*', '.+'] for elem in regex_elements if elem.text):
                self.warnings.append(SyntaxError(
                    severity='warning',
                    message="Low-level rule with broad matching",
                    suggestion="Broad patterns with low levels may cause noise"
                ))
    
    def _compile_results(self) -> Dict[str, any]:
        """Compile validation results"""
        
        total_issues = len(self.errors) + len(self.warnings) + len(self.info)
        
        # Determine overall status
        if self.errors:
            status = "INVALID"
        elif self.warnings:
            status = "WARNING"
        else:
            status = "VALID"
        
        return {
            "validation_status": status,
            "is_valid": len(self.errors) == 0,
            "total_issues": total_issues,
            "errors": len(self.errors),
            "warnings": len(self.warnings),
            "info": len(self.info),
            "issues": {
                "errors": [asdict(error) for error in self.errors],
                "warnings": [asdict(error) for error in self.warnings],
                "info": [asdict(error) for error in self.info]
            },
            "recommendations": self._generate_recommendations()
        }
    
    def _generate_recommendations(self) -> List[str]:
        """Generate improvement recommendations"""
        recommendations = []
        
        if self.errors:
            recommendations.append("Fix all syntax errors before deployment")
        
        if len(self.warnings) > 5:
            recommendations.append("Address warnings to improve rule quality")
        
        # Performance recommendations
        regex_warnings = [w for w in self.warnings if 'regex' in w.message.lower()]
        if regex_warnings:
            recommendations.append("Optimize regex patterns for better performance")
        
        # Security recommendations
        ip_info = [i for i in self.info if 'IP address' in i.message]
        if ip_info:
            recommendations.append("Review hardcoded IP addresses for flexibility")
        
        if not recommendations:
            recommendations.append("Rule validation passed - ready for testing")
        
        return recommendations

def main():
    """Example usage"""
    validator = WazuhSyntaxValidator()
    
    # Example rule
    example_rule = """
    <rule id="100001" level="5">
        <description>SSH authentication failure</description>
        <decoded_as>sshd</decoded_as>
        <regex>authentication failure</regex>
        <field name="srcip">.*</field>
    </rule>
    """
    
    result = validator.validate_rule(example_rule)
    
    print("Syntax Validation Results:")
    print("=" * 40)
    print(f"Status: {result['validation_status']}")
    print(f"Errors: {result['errors']}")
    print(f"Warnings: {result['warnings']}")
    print(f"Info: {result['info']}")
    
    if result['issues']['errors']:
        print("\nErrors:")
        for error in result['issues']['errors']:
            print(f"  - {error['message']}")
    
    if result['issues']['warnings']:
        print("\nWarnings:")
        for warning in result['issues']['warnings']:
            print(f"  - {warning['message']}")

if __name__ == "__main__":
    main()