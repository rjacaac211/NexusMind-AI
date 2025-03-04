# import os
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
                           "planner_model": "gpt-4o",
                           "writer_provider": "openai",
                           "writer_model": "gpt-4o-mini",
                           "max_search_depth": 1,
                           }}

@traceable
async def run_agent(topic: str, feedback: str = None) -> str:
    """
    Combined agent function.
    
    - If no feedback is provided, it performs Stage 1: generating a report plan and returns the bot's interrupt message.
    - If feedback is provided:
        - If the feedback (case-insensitive) is not "yes" or "true", it processes the feedback and returns an updated report plan prompt.
        - If the feedback is "yes" (or "true"), it finalizes the report and returns the final report.
    """
    if feedback is None:
        # Stage 1: Generate report plan
        plan_output = ""
        async for event in graph.astream({"topic": topic}, thread, stream_mode="updates"):
            plan_output += str(event) + "\n"
            if isinstance(event, dict) and '__interrupt__' in event:
                interrupt_obj = event["__interrupt__"]
                bot_message = interrupt_obj[0].value if isinstance(interrupt_obj, tuple) else interrupt_obj.value
                return bot_message
        return plan_output or "No report plan generated."
    else:
        # Check for final approval by comparing the feedback to "yes" or "true" (ignoring case)
        if feedback.strip().lower() not in ["yes", "true"]:
            async for event in graph.astream(Command(resume=feedback), thread, stream_mode="updates"):
                if isinstance(event, dict) and '__interrupt__' in event:
                    interrupt_obj = event["__interrupt__"]
                    bot_message = interrupt_obj[0].value if isinstance(interrupt_obj, tuple) else interrupt_obj.value
                    return bot_message
            return "No updated report plan generated."
        else:
            final_report = None
            async for event in graph.astream(Command(resume=True), thread, stream_mode="updates"):
                if isinstance(event, dict) and "compile_final_report" in event:
                    temp_report = event["compile_final_report"].get("final_report")
                    if temp_report:
                        final_report = temp_report
                        break
            return final_report or "No final report generated."

async def reset_agent():
    """"Reset the agent's memory and recompile the graph."""
    memory.clear()
    global graph
    graph = builder.compile(checkpointer=memory)
    return "Agent memory cleared."
