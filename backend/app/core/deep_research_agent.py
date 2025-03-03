import os
import uuid
from langgraph.types import Command
from langgraph.checkpoint.memory import MemorySaver
from open_deep_research.graph import builder
from langsmith import traceable
from dotenv import load_dotenv
load_dotenv()

# Compile the graph and initialize memory
memory = MemorySaver()
graph = builder.compile(checkpointer=memory)

# # View the graph as a PNG image
# os.makedirs("graph_view", exist_ok=True)
# image_path = "graph_view/graph.png"
# graph.get_graph(xray=1).draw_mermaid_png(output_file_path=image_path)
# print(f"Graph image saved at: {image_path}")

# Thread configuration
thread = {"configurable": {"thread_id": str(uuid.uuid4()),
                           "search_api": "tavily",
                           "planner_provider": "openai",
                           "planner_model": "gpt-4o-mini",
                           "writer_provider": "openai",
                           "writer_model": "gpt-4o-mini",
                           "max_search_depth": 1,
                           }}

# @traceable
async def run_agent_start(topic: str) -> str:
    """
    Stage 1: Generate a report plan based on the topic.
    Returns the bot's interrupt message (the report plan prompt) for feedback.
    """
    plan_output = ""
    async for event in graph.astream({"topic": topic}, thread, stream_mode="updates"):
        plan_output += str(event) + "\n"
        # Check for an interrupt event that prompts for feedback
        if isinstance(event, dict) and '__interrupt__' in event:
            interrupt_obj = event['__interrupt__']
            # Adjust extraction based on your interrupt object's structure:
            bot_message = interrupt_obj[0].value if isinstance(interrupt_obj, tuple) else interrupt_obj.value
            return bot_message
    return plan_output or "No report plan generated."

# @traceable
async def run_agent_resume(feedback: str) -> str:
    """
    Stage 2: Process feedback and finalize the report.
    """
    # Process feedback: send the provided feedback to the graph
    async for event in graph.astream(Command(resume=feedback), thread, stream_mode="updates"):
        pass  # You might log intermediate events if needed

    final_report = None
    # Finalize the report
    async for event in graph.astream(Command(resume=True), thread, stream_mode="updates"):
        if isinstance(event, dict) and "compile_final_report" in event:
            temp_report = event["compile_final_report"].get("final_report")
            if temp_report:
                final_report = temp_report
                break
    return final_report or "No final report generated."