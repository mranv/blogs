---
author: Anubhav Gain
pubDatetime: 2025-08-24T00:00:00+05:30
modDatetime: 2025-08-24T00:00:00+05:30
title: "Complete LangChain Integration with Wazuh MCP Server: Building AI-Powered Security Agents"
slug: wazuh-mcp-langchain-integration-tutorial
featured: false
draft: false
tags:
  - Wazuh
  - MCP
  - LangChain
  - AI
  - LLM
  - Python
  - Tutorial
  - Integration
  - OpenAI
  - Claude
category: Security
description: Step-by-step tutorial for integrating Wazuh MCP Server with LangChain to build intelligent security agents. Includes OpenAI, Claude, and local LLM integrations with practical examples.
---

# Complete LangChain Integration with Wazuh MCP Server: Building AI-Powered Security Agents

## Introduction

This comprehensive tutorial guides you through integrating the Wazuh MCP Server with LangChain to create intelligent security agents. We'll cover multiple LLM providers, advanced agent architectures, and production-ready implementations with real-world examples.

## Prerequisites

```bash
# Required packages
pip install langchain langchain-openai langchain-anthropic langchain-community
pip install git+https://github.com/socfortress/wazuh-mcp-server.git
pip install aiohttp asyncio python-dotenv pandas numpy
pip install chromadb faiss-cpu tiktoken
```

## Part 1: Basic LangChain Setup

### 1.1 MCP Client Implementation

```python
# mcp_langchain_client.py
import asyncio
import aiohttp
from typing import Dict, List, Optional, Any
from langchain.tools import BaseTool
from langchain.pydantic_v1 import BaseModel, Field
import json

class MCPClient:
    """Enhanced MCP Client for LangChain integration"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = None
        self.jwt_token = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        await self.authenticate()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def authenticate(self):
        """Authenticate with Wazuh MCP Server"""
        async with self.session.post(
            f"{self.base_url}/auth",
            json={"username": "admin", "password": "admin"}
        ) as resp:
            data = await resp.json()
            self.jwt_token = data['token']
    
    async def call_tool(self, tool_name: str, params: Dict) -> Dict:
        """Call an MCP tool"""
        headers = {"Authorization": f"Bearer {self.jwt_token}"}
        
        async with self.session.post(
            f"{self.base_url}/tools/{tool_name}",
            json=params,
            headers=headers
        ) as resp:
            return await resp.json()

class MCPToolWrapper(BaseTool):
    """Wrapper to convert MCP tools to LangChain tools"""
    
    name: str = "mcp_tool"
    description: str = "MCP tool for Wazuh operations"
    mcp_client: Optional[MCPClient] = None
    tool_name: str = ""
    
    class Config:
        arbitrary_types_allowed = True
    
    async def _arun(self, query: str) -> str:
        """Async execution of MCP tool"""
        params = json.loads(query) if isinstance(query, str) else query
        result = await self.mcp_client.call_tool(self.tool_name, params)
        return json.dumps(result, indent=2)
    
    def _run(self, query: str) -> str:
        """Sync wrapper for async execution"""
        return asyncio.run(self._arun(query))
```

### 1.2 Tool Registry Setup

```python
# tools_registry.py
from typing import List
from langchain.tools import Tool

class WazuhToolRegistry:
    """Registry of Wazuh MCP tools for LangChain"""
    
    @staticmethod
    def get_tools(mcp_client: MCPClient) -> List[Tool]:
        """Get all available Wazuh tools"""
        
        tools = []
        
        # Agent Management Tools
        tools.append(Tool(
            name="get_agents",
            description="Get list of all Wazuh agents with their status",
            func=lambda x: asyncio.run(
                mcp_client.call_tool("GetAgentsTool", json.loads(x))
            )
        ))
        
        # Process Analysis Tools
        tools.append(Tool(
            name="get_agent_processes",
            description="Get running processes on a specific agent",
            func=lambda x: asyncio.run(
                mcp_client.call_tool("GetAgentProcessesTool", json.loads(x))
            )
        ))
        
        # Network Analysis Tools
        tools.append(Tool(
            name="get_agent_ports",
            description="Get open network ports on a specific agent",
            func=lambda x: asyncio.run(
                mcp_client.call_tool("GetAgentPortsTool", json.loads(x))
            )
        ))
        
        # Package Management Tools
        tools.append(Tool(
            name="get_agent_packages",
            description="Get installed packages on a specific agent",
            func=lambda x: asyncio.run(
                mcp_client.call_tool("GetAgentPackagesTool", json.loads(x))
            )
        ))
        
        # Security Assessment Tools
        tools.append(Tool(
            name="get_agent_sca",
            description="Get security configuration assessment for an agent",
            func=lambda x: asyncio.run(
                mcp_client.call_tool("GetAgentSCATool", json.loads(x))
            )
        ))
        
        # Rule Management Tools
        tools.append(Tool(
            name="list_rules",
            description="List Wazuh detection rules",
            func=lambda x: asyncio.run(
                mcp_client.call_tool("ListRulesTool", json.loads(x))
            )
        ))
        
        return tools
```

## Part 2: OpenAI Integration

### 2.1 OpenAI Agent Setup

```python
# openai_security_agent.py
from langchain_openai import ChatOpenAI
from langchain.agents import create_openai_tools_agent, AgentExecutor
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.memory import ConversationBufferWindowMemory
import os
from dotenv import load_dotenv

load_dotenv()

class OpenAISecurityAgent:
    """OpenAI-powered security analysis agent"""
    
    def __init__(self, mcp_client: MCPClient):
        self.mcp_client = mcp_client
        self.llm = ChatOpenAI(
            model="gpt-4-turbo-preview",
            temperature=0,
            api_key=os.getenv("OPENAI_API_KEY")
        )
        self.tools = WazuhToolRegistry.get_tools(mcp_client)
        self.memory = ConversationBufferWindowMemory(
            k=10,
            return_messages=True,
            memory_key="chat_history"
        )
        self.agent = self._create_agent()
        
    def _create_agent(self):
        """Create the OpenAI agent with Wazuh tools"""
        
        system_prompt = """You are a senior security analyst with expertise in:
        - Incident response and threat hunting
        - SIEM analysis using Wazuh
        - Network and endpoint security
        - Malware analysis and forensics
        
        You have access to Wazuh MCP tools to query security data. 
        Always provide detailed analysis with evidence.
        Prioritize findings by severity and business impact.
        Suggest remediation steps for identified issues.
        """
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad")
        ])
        
        agent = create_openai_tools_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=prompt
        )
        
        return AgentExecutor(
            agent=agent,
            tools=self.tools,
            memory=self.memory,
            verbose=True,
            max_iterations=10,
            handle_parsing_errors=True
        )
    
    async def analyze(self, query: str) -> str:
        """Analyze security query using OpenAI"""
        result = await self.agent.ainvoke({"input": query})
        return result["output"]
    
    async def investigate_alert(self, alert: Dict) -> Dict:
        """Investigate security alert with context"""
        
        investigation_prompt = f"""
        Investigate this security alert:
        
        Alert Details:
        - Rule: {alert.get('rule', {}).get('description')}
        - Agent: {alert.get('agent', {}).get('name')} ({alert.get('agent', {}).get('id')})
        - Severity: {alert.get('rule', {}).get('level')}
        - Time: {alert.get('timestamp')}
        
        Perform the following:
        1. Check the agent's current status
        2. List suspicious processes on the agent
        3. Check network connections
        4. Assess security configuration
        5. Provide risk assessment
        6. Recommend immediate actions
        """
        
        return await self.analyze(investigation_prompt)
```

### 2.2 Advanced OpenAI Chains

```python
# openai_chain_examples.py
from langchain.chains import LLMChain, SequentialChain
from langchain.prompts import PromptTemplate
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List

class ThreatAssessment(BaseModel):
    """Structured threat assessment output"""
    severity: int = Field(description="Severity score 1-10")
    threat_type: str = Field(description="Type of threat detected")
    affected_assets: List[str] = Field(description="List of affected assets")
    iocs: List[str] = Field(description="Indicators of compromise")
    remediation_steps: List[str] = Field(description="Recommended actions")
    confidence: float = Field(description="Confidence score 0-1")

class AdvancedOpenAIChains:
    """Advanced analysis chains using OpenAI"""
    
    def __init__(self, llm: ChatOpenAI, mcp_client: MCPClient):
        self.llm = llm
        self.mcp_client = mcp_client
        
    def create_threat_assessment_chain(self):
        """Chain for structured threat assessment"""
        
        parser = PydanticOutputParser(pydantic_object=ThreatAssessment)
        
        # First chain: Data collection
        collection_prompt = PromptTemplate(
            input_variables=["agent_id"],
            template="""
            Collect security data for agent {agent_id}:
            1. Get agent status and information
            2. List running processes
            3. Check network connections
            4. Review installed packages
            5. Assess security configuration
            
            Compile all findings.
            """
        )
        
        collection_chain = LLMChain(
            llm=self.llm,
            prompt=collection_prompt,
            output_key="raw_data"
        )
        
        # Second chain: Threat analysis
        analysis_prompt = PromptTemplate(
            input_variables=["raw_data"],
            template="""
            Analyze the following security data for threats:
            {raw_data}
            
            {format_instructions}
            
            Provide a comprehensive threat assessment.
            """,
            partial_variables={
                "format_instructions": parser.get_format_instructions()
            }
        )
        
        analysis_chain = LLMChain(
            llm=self.llm,
            prompt=analysis_prompt,
            output_key="threat_assessment"
        )
        
        # Sequential chain
        return SequentialChain(
            chains=[collection_chain, analysis_chain],
            input_variables=["agent_id"],
            output_variables=["threat_assessment"],
            verbose=True
        )
    
    def create_incident_response_chain(self):
        """Chain for automated incident response"""
        
        # Detection chain
        detection_prompt = PromptTemplate(
            input_variables=["indicators"],
            template="""
            Detect security incidents based on these indicators:
            {indicators}
            
            Search for:
            1. Matching patterns across agents
            2. Related suspicious activities
            3. Potential attack vectors
            4. Affected systems
            """
        )
        
        # Investigation chain
        investigation_prompt = PromptTemplate(
            input_variables=["detection_results"],
            template="""
            Investigate detected incidents:
            {detection_results}
            
            Perform:
            1. Root cause analysis
            2. Timeline reconstruction
            3. Impact assessment
            4. Attribution analysis
            """
        )
        
        # Response chain
        response_prompt = PromptTemplate(
            input_variables=["investigation_results"],
            template="""
            Generate incident response plan:
            {investigation_results}
            
            Include:
            1. Containment strategies
            2. Eradication steps
            3. Recovery procedures
            4. Lessons learned
            """
        )
        
        detection_chain = LLMChain(
            llm=self.llm, 
            prompt=detection_prompt,
            output_key="detection_results"
        )
        
        investigation_chain = LLMChain(
            llm=self.llm,
            prompt=investigation_prompt,
            output_key="investigation_results"
        )
        
        response_chain = LLMChain(
            llm=self.llm,
            prompt=response_prompt,
            output_key="response_plan"
        )
        
        return SequentialChain(
            chains=[detection_chain, investigation_chain, response_chain],
            input_variables=["indicators"],
            output_variables=["response_plan"],
            verbose=True
        )
```

## Part 3: Claude Integration

### 3.1 Claude Agent Implementation

```python
# claude_security_agent.py
from langchain_anthropic import ChatAnthropic
from langchain.agents import create_structured_chat_agent
import os

class ClaudeSecurityAgent:
    """Claude-powered security analysis agent"""
    
    def __init__(self, mcp_client: MCPClient):
        self.mcp_client = mcp_client
        self.llm = ChatAnthropic(
            model="claude-3-opus-20240229",
            temperature=0,
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
            max_tokens=4096
        )
        self.tools = WazuhToolRegistry.get_tools(mcp_client)
        self.agent = self._create_agent()
        
    def _create_agent(self):
        """Create Claude agent with enhanced reasoning"""
        
        system_prompt = """You are Claude, an advanced AI security analyst.
        
        Your capabilities include:
        - Deep security analysis with attention to detail
        - Pattern recognition across complex datasets
        - Hypothesis generation and testing
        - Comprehensive threat modeling
        
        Approach each analysis systematically:
        1. Gather comprehensive data
        2. Identify patterns and anomalies
        3. Form hypotheses about potential threats
        4. Test hypotheses with additional queries
        5. Provide evidence-based conclusions
        
        Use the Wazuh MCP tools to gather data and validate findings.
        Always explain your reasoning process.
        """
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad")
        ])
        
        agent = create_structured_chat_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=prompt
        )
        
        return AgentExecutor(
            agent=agent,
            tools=self.tools,
            verbose=True,
            max_iterations=15,  # Claude can handle more complex reasoning
            handle_parsing_errors=True,
            return_intermediate_steps=True
        )
    
    async def deep_analysis(self, context: Dict) -> Dict:
        """Perform deep security analysis with Claude"""
        
        analysis_prompt = f"""
        Perform a comprehensive security analysis:
        
        Context: {json.dumps(context, indent=2)}
        
        Your analysis should include:
        1. Threat landscape assessment
        2. Vulnerability identification
        3. Attack vector analysis
        4. Risk scoring with justification
        5. Detailed remediation plan
        6. Preventive measures
        
        Use multiple tools to validate findings.
        Provide confidence levels for each conclusion.
        """
        
        result = await self.agent.ainvoke({"input": analysis_prompt})
        
        return {
            "analysis": result["output"],
            "reasoning_steps": result.get("intermediate_steps", []),
            "tools_used": self._extract_tools_used(result)
        }
    
    def _extract_tools_used(self, result: Dict) -> List[str]:
        """Extract list of tools used in analysis"""
        tools_used = []
        for step in result.get("intermediate_steps", []):
            if hasattr(step[0], "tool"):
                tools_used.append(step[0].tool)
        return list(set(tools_used))
```

### 3.2 Claude Advanced Reasoning

```python
# claude_reasoning_chains.py
class ClaudeReasoningChains:
    """Advanced reasoning chains with Claude"""
    
    def __init__(self, claude_agent: ClaudeSecurityAgent):
        self.agent = claude_agent
        
    async def hypothesis_testing_analysis(self, initial_observation: str):
        """Hypothesis-driven security analysis"""
        
        # Generate hypotheses
        hypothesis_prompt = f"""
        Based on this observation: {initial_observation}
        
        Generate 5 possible security hypotheses that could explain this observation.
        For each hypothesis, list:
        1. The hypothesis statement
        2. What evidence would support it
        3. What evidence would refute it
        4. How to test it using Wazuh tools
        """
        
        hypotheses = await self.agent.agent.ainvoke({
            "input": hypothesis_prompt
        })
        
        # Test each hypothesis
        test_results = []
        for hypothesis in self._parse_hypotheses(hypotheses["output"]):
            test_prompt = f"""
            Test this security hypothesis:
            {hypothesis}
            
            Use Wazuh tools to:
            1. Gather supporting evidence
            2. Look for contradicting evidence
            3. Calculate probability of hypothesis being true
            """
            
            test_result = await self.agent.agent.ainvoke({
                "input": test_prompt
            })
            
            test_results.append({
                "hypothesis": hypothesis,
                "test_result": test_result["output"],
                "tools_used": self._extract_tools(test_result)
            })
        
        # Synthesize findings
        synthesis_prompt = f"""
        Synthesize the hypothesis testing results:
        {json.dumps(test_results, indent=2)}
        
        Provide:
        1. Most likely explanation
        2. Confidence level
        3. Supporting evidence
        4. Recommended actions
        5. Further investigation needed
        """
        
        synthesis = await self.agent.agent.ainvoke({
            "input": synthesis_prompt
        })
        
        return {
            "initial_observation": initial_observation,
            "hypotheses_tested": test_results,
            "conclusion": synthesis["output"]
        }
    
    async def threat_actor_attribution(self, indicators: List[str]):
        """Attribute activity to threat actors"""
        
        attribution_prompt = f"""
        Analyze these indicators for threat actor attribution:
        {json.dumps(indicators, indent=2)}
        
        Perform:
        1. TTP analysis and mapping to MITRE ATT&CK
        2. Infrastructure analysis
        3. Malware family identification
        4. Historical campaign correlation
        5. Attribution confidence assessment
        
        Use Wazuh tools to gather evidence from affected systems.
        Consider multiple attribution hypotheses.
        """
        
        attribution = await self.agent.agent.ainvoke({
            "input": attribution_prompt
        })
        
        return self._parse_attribution(attribution["output"])
```

## Part 4: Multi-Agent Collaboration

### 4.1 Collaborative Agent System

```python
# multi_agent_system.py
from typing import List, Dict, Any
import asyncio

class SecurityAgentTeam:
    """Multi-agent collaborative security analysis"""
    
    def __init__(self, mcp_client: MCPClient):
        self.mcp_client = mcp_client
        
        # Initialize specialized agents
        self.agents = {
            "threat_hunter": self._create_threat_hunter(),
            "incident_responder": self._create_incident_responder(),
            "forensic_analyst": self._create_forensic_analyst(),
            "compliance_auditor": self._create_compliance_auditor(),
            "coordinator": self._create_coordinator()
        }
    
    def _create_threat_hunter(self):
        """Create specialized threat hunting agent"""
        llm = ChatOpenAI(model="gpt-4", temperature=0.2)
        
        prompt = """You are a specialized threat hunter.
        Focus on:
        - Identifying advanced persistent threats
        - Behavioral anomaly detection
        - Threat intelligence correlation
        - Proactive threat detection
        """
        
        return self._build_agent(llm, prompt, "threat_hunter")
    
    def _create_incident_responder(self):
        """Create specialized incident response agent"""
        llm = ChatOpenAI(model="gpt-4", temperature=0)
        
        prompt = """You are a specialized incident responder.
        Focus on:
        - Rapid incident triage
        - Containment strategies
        - Evidence preservation
        - Recovery procedures
        """
        
        return self._build_agent(llm, prompt, "incident_responder")
    
    def _create_forensic_analyst(self):
        """Create specialized forensic analysis agent"""
        llm = ChatAnthropic(model="claude-3-opus-20240229", temperature=0)
        
        prompt = """You are a specialized forensic analyst.
        Focus on:
        - Timeline reconstruction
        - Artifact analysis
        - Root cause analysis
        - Evidence chain preservation
        """
        
        return self._build_agent(llm, prompt, "forensic_analyst")
    
    def _create_compliance_auditor(self):
        """Create specialized compliance audit agent"""
        llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
        
        prompt = """You are a specialized compliance auditor.
        Focus on:
        - Regulatory compliance validation
        - Control effectiveness testing
        - Gap analysis
        - Audit evidence collection
        """
        
        return self._build_agent(llm, prompt, "compliance_auditor")
    
    def _create_coordinator(self):
        """Create coordinator agent to orchestrate team"""
        llm = ChatOpenAI(model="gpt-4", temperature=0.1)
        
        prompt = """You are the security team coordinator.
        Your role:
        - Assign tasks to specialized agents
        - Synthesize findings from multiple agents
        - Resolve conflicts in analysis
        - Provide unified recommendations
        
        Available agents:
        - threat_hunter: For APT and threat detection
        - incident_responder: For incident handling
        - forensic_analyst: For deep forensic analysis
        - compliance_auditor: For compliance checks
        """
        
        return self._build_agent(llm, prompt, "coordinator")
    
    def _build_agent(self, llm, prompt, role):
        """Build an agent with specific role"""
        tools = WazuhToolRegistry.get_tools(self.mcp_client)
        
        full_prompt = ChatPromptTemplate.from_messages([
            ("system", prompt),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad")
        ])
        
        agent = create_openai_tools_agent(
            llm=llm,
            tools=tools,
            prompt=full_prompt
        )
        
        return AgentExecutor(
            agent=agent,
            tools=tools,
            verbose=True,
            max_iterations=10
        )
    
    async def collaborative_analysis(self, scenario: str) -> Dict:
        """Perform collaborative multi-agent analysis"""
        
        # Coordinator assigns tasks
        coordination_prompt = f"""
        Analyze this scenario and assign tasks to appropriate agents:
        {scenario}
        
        For each agent, specify:
        1. What they should investigate
        2. Key questions to answer
        3. Tools they should use
        """
        
        coordination_plan = await self.agents["coordinator"].ainvoke({
            "input": coordination_prompt
        })
        
        # Execute parallel agent tasks
        tasks = []
        for agent_name, agent in self.agents.items():
            if agent_name != "coordinator":
                task_prompt = f"""
                Based on this scenario: {scenario}
                
                Perform your specialized analysis as {agent_name}.
                Focus on your area of expertise.
                """
                
                tasks.append(agent.ainvoke({"input": task_prompt}))
        
        # Gather results
        results = await asyncio.gather(*tasks)
        
        # Coordinator synthesizes findings
        synthesis_prompt = f"""
        Synthesize these findings from the team:
        
        {json.dumps([r["output"] for r in results], indent=2)}
        
        Provide:
        1. Unified threat assessment
        2. Prioritized findings
        3. Comprehensive action plan
        4. Risk score
        """
        
        final_analysis = await self.agents["coordinator"].ainvoke({
            "input": synthesis_prompt
        })
        
        return {
            "scenario": scenario,
            "coordination_plan": coordination_plan["output"],
            "agent_findings": {
                agent_name: results[i]["output"]
                for i, agent_name in enumerate(self.agents.keys())
                if agent_name != "coordinator"
            },
            "synthesis": final_analysis["output"]
        }
```

### 4.2 Agent Communication Protocol

```python
# agent_communication.py
import asyncio
from asyncio import Queue
from dataclasses import dataclass
from enum import Enum

class MessageType(Enum):
    REQUEST = "request"
    RESPONSE = "response"
    BROADCAST = "broadcast"
    ALERT = "alert"

@dataclass
class AgentMessage:
    sender: str
    recipient: str
    message_type: MessageType
    content: Dict
    priority: int = 5

class AgentCommunicationHub:
    """Central communication hub for multi-agent system"""
    
    def __init__(self):
        self.message_queues = {}
        self.broadcast_queue = Queue()
        self.alert_handlers = []
        
    def register_agent(self, agent_name: str):
        """Register an agent with the communication hub"""
        self.message_queues[agent_name] = Queue()
    
    async def send_message(self, message: AgentMessage):
        """Send message between agents"""
        if message.message_type == MessageType.BROADCAST:
            await self.broadcast_queue.put(message)
            await self._handle_broadcast(message)
        elif message.message_type == MessageType.ALERT:
            await self._handle_alert(message)
        else:
            if message.recipient in self.message_queues:
                await self.message_queues[message.recipient].put(message)
    
    async def receive_message(self, agent_name: str) -> AgentMessage:
        """Receive message for specific agent"""
        if agent_name in self.message_queues:
            return await self.message_queues[agent_name].get()
    
    async def _handle_broadcast(self, message: AgentMessage):
        """Handle broadcast messages to all agents"""
        for agent_name, queue in self.message_queues.items():
            if agent_name != message.sender:
                await queue.put(message)
    
    async def _handle_alert(self, message: AgentMessage):
        """Handle high-priority alerts"""
        for handler in self.alert_handlers:
            await handler(message)
    
    def register_alert_handler(self, handler):
        """Register handler for alerts"""
        self.alert_handlers.append(handler)

class CollaborativeAgent:
    """Base class for collaborative agents"""
    
    def __init__(self, name: str, hub: AgentCommunicationHub):
        self.name = name
        self.hub = hub
        self.hub.register_agent(name)
        
    async def send_to(self, recipient: str, content: Dict):
        """Send message to another agent"""
        message = AgentMessage(
            sender=self.name,
            recipient=recipient,
            message_type=MessageType.REQUEST,
            content=content
        )
        await self.hub.send_message(message)
    
    async def broadcast(self, content: Dict):
        """Broadcast message to all agents"""
        message = AgentMessage(
            sender=self.name,
            recipient="all",
            message_type=MessageType.BROADCAST,
            content=content
        )
        await self.hub.send_message(message)
    
    async def alert(self, content: Dict):
        """Send high-priority alert"""
        message = AgentMessage(
            sender=self.name,
            recipient="all",
            message_type=MessageType.ALERT,
            content=content,
            priority=10
        )
        await self.hub.send_message(message)
    
    async def process_messages(self):
        """Process incoming messages"""
        while True:
            message = await self.hub.receive_message(self.name)
            await self.handle_message(message)
    
    async def handle_message(self, message: AgentMessage):
        """Override in subclass to handle messages"""
        pass
```

## Part 5: RAG Implementation

### 5.1 Vector Store Setup

```python
# rag_setup.py
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.document_loaders import TextLoader, JSONLoader
import chromadb

class WazuhRAGSystem:
    """RAG system for Wazuh knowledge and context"""
    
    def __init__(self, persist_directory="./wazuh_vectorstore"):
        self.embeddings = OpenAIEmbeddings()
        self.persist_directory = persist_directory
        self.client = chromadb.PersistentClient(path=persist_directory)
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        self.collections = {
            "rules": self._create_collection("wazuh_rules"),
            "alerts": self._create_collection("wazuh_alerts"),
            "agents": self._create_collection("wazuh_agents"),
            "threats": self._create_collection("threat_intelligence")
        }
    
    def _create_collection(self, name: str):
        """Create or get a collection"""
        try:
            return self.client.get_collection(name)
        except:
            return self.client.create_collection(
                name=name,
                embedding_function=self.embeddings
            )
    
    async def index_wazuh_data(self, mcp_client: MCPClient):
        """Index Wazuh data for RAG"""
        
        # Index rules
        rules = await mcp_client.call_tool("ListRulesTool", {})
        for rule in rules.get("rules", []):
            self.collections["rules"].add(
                documents=[rule["description"]],
                metadatas=[{
                    "rule_id": rule["id"],
                    "level": rule["level"],
                    "groups": ",".join(rule.get("groups", []))
                }],
                ids=[f"rule_{rule['id']}"]
            )
        
        # Index agent information
        agents = await mcp_client.call_tool("GetAgentsTool", {})
        for agent in agents.get("agents", []):
            self.collections["agents"].add(
                documents=[json.dumps(agent)],
                metadatas=[{
                    "agent_id": agent["id"],
                    "name": agent["name"],
                    "os": agent.get("os", {}).get("platform", ""),
                    "status": agent["status"]
                }],
                ids=[f"agent_{agent['id']}"]
            )
    
    def similarity_search(self, query: str, collection: str, k: int = 5):
        """Search for similar documents"""
        results = self.collections[collection].query(
            query_texts=[query],
            n_results=k
        )
        return results
    
    async def get_relevant_context(self, query: str) -> str:
        """Get relevant context for a query"""
        contexts = []
        
        # Search across all collections
        for collection_name, collection in self.collections.items():
            results = collection.query(
                query_texts=[query],
                n_results=3
            )
            
            for doc, metadata in zip(
                results["documents"][0], 
                results["metadatas"][0]
            ):
                contexts.append(f"[{collection_name}] {doc}")
        
        return "\n\n".join(contexts)
```

### 5.2 RAG-Enhanced Agent

```python
# rag_enhanced_agent.py
from langchain.chains import RetrievalQA
from langchain.memory import ConversationSummaryBufferMemory

class RAGEnhancedSecurityAgent:
    """Security agent enhanced with RAG capabilities"""
    
    def __init__(self, mcp_client: MCPClient, rag_system: WazuhRAGSystem):
        self.mcp_client = mcp_client
        self.rag_system = rag_system
        self.llm = ChatOpenAI(model="gpt-4", temperature=0)
        self.tools = WazuhToolRegistry.get_tools(mcp_client)
        self.memory = ConversationSummaryBufferMemory(
            llm=self.llm,
            max_token_limit=2000,
            return_messages=True
        )
        self.agent = self._create_rag_agent()
    
    def _create_rag_agent(self):
        """Create RAG-enhanced agent"""
        
        system_prompt = """You are a security analyst with access to:
        1. Wazuh MCP tools for real-time queries
        2. Historical knowledge base via RAG
        3. Threat intelligence database
        
        For each query:
        - Search the knowledge base for relevant context
        - Use MCP tools to get current data
        - Combine historical and real-time information
        - Provide comprehensive analysis
        """
        
        # Custom RAG tool
        rag_tool = Tool(
            name="search_knowledge_base",
            func=lambda q: asyncio.run(self.rag_system.get_relevant_context(q)),
            description="Search historical data and threat intelligence"
        )
        
        all_tools = self.tools + [rag_tool]
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad")
        ])
        
        agent = create_openai_tools_agent(
            llm=self.llm,
            tools=all_tools,
            prompt=prompt
        )
        
        return AgentExecutor(
            agent=agent,
            tools=all_tools,
            memory=self.memory,
            verbose=True
        )
    
    async def analyze_with_context(self, query: str) -> Dict:
        """Analyze with RAG context"""
        
        # Get historical context
        context = await self.rag_system.get_relevant_context(query)
        
        enhanced_query = f"""
        Query: {query}
        
        Historical Context:
        {context}
        
        Use both the historical context and real-time Wazuh data to provide analysis.
        """
        
        result = await self.agent.ainvoke({"input": enhanced_query})
        
        return {
            "query": query,
            "context_used": context,
            "analysis": result["output"],
            "sources": self._extract_sources(result)
        }
    
    def _extract_sources(self, result: Dict) -> List[str]:
        """Extract data sources used"""
        sources = []
        for step in result.get("intermediate_steps", []):
            if hasattr(step[0], "tool"):
                sources.append(f"Tool: {step[0].tool}")
        return sources
```

## Part 6: Production Deployment

### 6.1 Async Application

```python
# production_app.py
import asyncio
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="Wazuh MCP LangChain API")
security = HTTPBearer()

class QueryRequest(BaseModel):
    query: str
    agent_type: str = "openai"  # openai, claude, multi
    use_rag: bool = False

class ProductionSecurityAPI:
    def __init__(self):
        self.mcp_client = None
        self.agents = {}
        self.rag_system = None
        
    async def initialize(self):
        """Initialize all components"""
        self.mcp_client = MCPClient()
        await self.mcp_client.authenticate()
        
        # Initialize RAG system
        self.rag_system = WazuhRAGSystem()
        await self.rag_system.index_wazuh_data(self.mcp_client)
        
        # Initialize agents
        self.agents = {
            "openai": OpenAISecurityAgent(self.mcp_client),
            "claude": ClaudeSecurityAgent(self.mcp_client),
            "multi": SecurityAgentTeam(self.mcp_client),
            "rag": RAGEnhancedSecurityAgent(self.mcp_client, self.rag_system)
        }

api_instance = ProductionSecurityAPI()

@app.on_event("startup")
async def startup_event():
    await api_instance.initialize()

@app.post("/analyze")
async def analyze_security(
    request: QueryRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Analyze security query using specified agent"""
    
    # Validate token
    if not validate_token(credentials.credentials):
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Select agent
    if request.use_rag:
        agent = api_instance.agents["rag"]
        result = await agent.analyze_with_context(request.query)
    elif request.agent_type == "multi":
        agent = api_instance.agents["multi"]
        result = await agent.collaborative_analysis(request.query)
    else:
        agent = api_instance.agents.get(request.agent_type)
        if not agent:
            raise HTTPException(status_code=400, detail="Invalid agent type")
        result = await agent.analyze(request.query)
    
    return {"status": "success", "result": result}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "agents_loaded": len(api_instance.agents)}

def validate_token(token: str) -> bool:
    """Validate JWT token"""
    # Implement token validation
    return True

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
```

### 6.2 Docker Deployment

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV OPENAI_API_KEY=""
ENV ANTHROPIC_API_KEY=""
ENV WAZUH_MCP_URL="http://wazuh-mcp:8000"

# Run application
CMD ["python", "-m", "uvicorn", "production_app:app", "--host", "0.0.0.0", "--port", "8080"]
```

### 6.3 Kubernetes Deployment

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wazuh-langchain-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: wazuh-langchain
  template:
    metadata:
      labels:
        app: wazuh-langchain
    spec:
      containers:
      - name: api
        image: wazuh-langchain:latest
        ports:
        - containerPort: 8080
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: openai
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: anthropic
        - name: WAZUH_MCP_URL
          value: "http://wazuh-mcp-service:8000"
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: wazuh-langchain-service
spec:
  selector:
    app: wazuh-langchain
  ports:
  - port: 80
    targetPort: 8080
  type: LoadBalancer
```

## Part 7: Testing & Monitoring

### 7.1 Integration Tests

```python
# test_langchain_integration.py
import pytest
import asyncio
from unittest.mock import Mock, patch

@pytest.mark.asyncio
async def test_openai_agent_analysis():
    """Test OpenAI agent analysis"""
    mock_mcp = Mock(spec=MCPClient)
    mock_mcp.call_tool.return_value = {
        "agents": [{"id": "001", "name": "test-agent"}]
    }
    
    agent = OpenAISecurityAgent(mock_mcp)
    result = await agent.analyze("List all agents")
    
    assert result is not None
    assert "agent" in result.lower()

@pytest.mark.asyncio
async def test_multi_agent_collaboration():
    """Test multi-agent collaboration"""
    mock_mcp = Mock(spec=MCPClient)
    team = SecurityAgentTeam(mock_mcp)
    
    result = await team.collaborative_analysis(
        "Investigate suspicious activity on agent 001"
    )
    
    assert "threat_hunter" in result["agent_findings"]
    assert "synthesis" in result

@pytest.mark.asyncio
async def test_rag_context_retrieval():
    """Test RAG context retrieval"""
    rag_system = WazuhRAGSystem(persist_directory="./test_vectorstore")
    
    # Add test data
    rag_system.collections["rules"].add(
        documents=["Test security rule for malware detection"],
        metadatas=[{"rule_id": "100001", "level": "10"}],
        ids=["test_rule_1"]
    )
    
    context = await rag_system.get_relevant_context("malware")
    assert "malware" in context.lower()
```

### 7.2 Performance Monitoring

```python
# monitoring.py
from prometheus_client import Counter, Histogram, Gauge
import time

# Metrics
agent_requests = Counter(
    'langchain_agent_requests_total',
    'Total agent requests',
    ['agent_type', 'status']
)

agent_response_time = Histogram(
    'langchain_agent_response_seconds',
    'Agent response time',
    ['agent_type']
)

active_agents = Gauge(
    'langchain_active_agents',
    'Number of active agents'
)

class PerformanceMonitor:
    """Monitor LangChain agent performance"""
    
    @staticmethod
    def track_request(agent_type: str):
        """Decorator to track agent requests"""
        def decorator(func):
            async def wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = await func(*args, **kwargs)
                    agent_requests.labels(
                        agent_type=agent_type,
                        status='success'
                    ).inc()
                    return result
                except Exception as e:
                    agent_requests.labels(
                        agent_type=agent_type,
                        status='error'
                    ).inc()
                    raise
                finally:
                    duration = time.time() - start_time
                    agent_response_time.labels(
                        agent_type=agent_type
                    ).observe(duration)
            return wrapper
        return decorator
```

## Conclusion

This comprehensive tutorial demonstrates how to integrate Wazuh MCP Server with LangChain to build sophisticated AI-powered security agents. Key capabilities include:

- **Multiple LLM Support**: OpenAI, Claude, and local models
- **Multi-Agent Collaboration**: Specialized agents working together
- **RAG Integration**: Historical context and knowledge retrieval
- **Production Deployment**: Scalable API with monitoring
- **Advanced Reasoning**: Hypothesis testing and threat attribution

The combination of Wazuh's security data and LangChain's AI orchestration enables next-generation security operations with natural language interfaces and intelligent automation.
