"""
AI Models Configuration
Configuração centralizada dos modelos de IA conforme modelos.txt
"""
from openai import OpenAI

# AI Models Configuration - Configuração atualizada conforme modelos.txt
AI_MODELS = {
    # Modelos para análise de parágrafo
    "deepseek_14b": {
        "name": "DeepSeek R1 Distill 14B",
        "client": OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key="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"
        ),
        "model": "deepseek-ai/deepseek-r1-distill-qwen-14b",
        "usage": "paragraph",
        "temperature": 0.5,
        "top_p": 0.7,
        "max_tokens": 4096
    },
    
    # Modelos para análise completa
    "llama_253b": {
        "name": "Llama 3.1 Nemotron Ultra 253B",
        "client": OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key="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"
        ),
        "model": "nvidia/llama-3.1-nemotron-ultra-253b-v1",
        "usage": "full_analysis",
        "temperature": 0.6,
        "top_p": 0.95,
        "max_tokens": 16384,
        "system_message": "detailed thinking on"
    },
    "deepseek_r1": {
        "name": "DeepSeek R1",
        "client": OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key="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"
        ),
        "model": "deepseek-ai/deepseek-r1-0528",
        "usage": "full_analysis_fallback",
        "temperature": 0.6,
        "top_p": 0.7,
        "max_tokens": 4096
    },
    
    # Modelos para análise profunda
    "kimi_k2": {
        "name": "Kimi K2 Instruct",
        "client": OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key="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"
        ),
        "model": "moonshotai/kimi-k2-instruct",
        "usage": "deep_analysis",
        "temperature": 0.6,
        "top_p": 0.9,
        "max_tokens": 16384
    },
    "qwen3_235b": {
        "name": "Qwen3 235B",
        "client": OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key="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"
        ),
        "model": "qwen/qwen3-235b-a22b",
        "usage": "deep_analysis",
        "temperature": 0.2,
        "top_p": 0.7,
        "max_tokens": 16384,
        "extra_body": {"chat_template_kwargs": {"thinking": True}}
    },
    
    # Modelo para interpretação e junção (análise profunda)
    "llama_49b": {
        "name": "Llama 3.3 Nemotron Super 49B",
        "client": OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key="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"
        ),
        "model": "nvidia/llama-3.3-nemotron-super-49b-v1.5",
        "usage": "deep_analysis_synthesis",
        "temperature": 0.6,
        "top_p": 0.95,
        "max_tokens": 65536,
        "system_message": "/think"
    }
}