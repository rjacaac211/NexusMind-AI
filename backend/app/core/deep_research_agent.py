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
                           "writer_model": "gpt-4o",
                           "max_search_depth": 1,
                           }}

@traceable
async def run_agent(topic: str, approved: bool = None, feedback: str = "") -> dict:
    """
    - If approved is None, it performs Stage 1: generating a report plan and returns a dict with approval_required set to True.
    - If approved is provided:
       - If approved is True, it finalizes the report.
       - If approved is False, it processes the provided feedback and returns an updated plan with approval_required True.
    """
    if approved is None:
        # Generate report plan
        plan_output = ""
        async for event in graph.astream({"topic": topic}, thread, stream_mode="updates"):
            plan_output += str(event) + "\n"
            if isinstance(event, dict) and '__interrupt__' in event:
                interrupt_obj = event["__interrupt__"]
                bot_message = (
                    interrupt_obj[0].value
                    if isinstance(interrupt_obj, tuple)
                    else interrupt_obj.value
                )
                return {"bot_message": bot_message, "approval_required": True}
        return {"bot_message": plan_output or "No report plan generated.", "approval_required": True}
    else:
        # Check for final approval
        if approved:
            final_report = None
            async for event in graph.astream(Command(resume=True), thread, stream_mode="updates"):
                if isinstance(event, dict) and "compile_final_report" in event:
                    temp_report = event["compile_final_report"].get("final_report")
                    if temp_report:
                        final_report = temp_report
                        break
            return {"bot_message": final_report or "No final report generated.", "approval_required": False}
        else:
            async for event in graph.astream(Command(resume=feedback), thread, stream_mode="updates"):
                if isinstance(event, dict) and '__interrupt__' in event:
                    interrupt_obj = event["__interrupt__"]
                    bot_message = (
                        interrupt_obj[0].value
                        if isinstance(interrupt_obj, tuple)
                        else interrupt_obj.value
                    )
                    return {"bot_message": bot_message, "approval_required": True}
            return {"bot_message": "No updated report plan generated.", "approval_required": True}

async def reset_agent():
    """"Reset the agent's memory and recompile the graph."""
    memory.clear()
    global graph
    graph = builder.compile(checkpointer=memory)
    return "Agent memory cleared."
