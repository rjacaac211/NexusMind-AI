import os
import uuid
import asyncio
from langgraph.types import Command
from langgraph.checkpoint.memory import MemorySaver
from open_deep_research.graph import builder
from langsmith import traceable

# Load the environment variables from the .env file
from dotenv import load_dotenv
load_dotenv()

# Compile the graph
memory = MemorySaver()
graph = builder.compile(checkpointer=memory)


# View the graph as a PNG image
os.makedirs("graph_view", exist_ok=True)
image_path = "graph_view/graph.png"
graph.get_graph(xray=1).draw_mermaid_png(output_file_path=image_path)
print(f"Graph image saved at: {image_path}")

# Run the graph with desired topic and configuration
thread = {"configurable": {"thread_id": str(uuid.uuid4()),
                           "search_api": "tavily",
                           "planner_provider": "openai",
                           "planner_model": "gpt-4o-mini",
                           "writer_provider": "openai",
                           "writer_model": "gpt-4o-mini",
                           "max_search_depth": 1,
                           }}

# Let user choose the topic
topic = input("Enter the report topic: ")

@traceable
async def run_graph():
    final_report = None

    # Stage 1: Generate report plan
    print("\n=== Generating report plan ===\n")
    async for event in graph.astream({"topic": topic}, thread, stream_mode="updates"):
        print(event)
        print("\n")

    
    # Stage 2: Request feedback on the report plan
    user_feedback = input("Enter feedback on the report plan (type 'approve' to approve): ")
    feedback_input = True if user_feedback.strip().lower() == "approve" else user_feedback
    print("\n=== Processing feedback ===\n")
    async for event in graph.astream(Command(resume=feedback_input), thread, stream_mode="updates"):
        print(event)
        print("\n")

    # Stage 3: Approve report plan and finalize report generation
    print("\n=== Finalizing report ===\n")
    async for event in graph.astream(Command(resume=True), thread, stream_mode="updates"):
        print(event)
        print("\n")
        # Look for the final report output in this event
        if isinstance(event, dict) and "compile_final_report" in event:
            final_report = event["compile_final_report"].get("final_report")

    # Save final report as Markdown if found
    if final_report:
        with open("report.md", "w", encoding="utf-8") as f:
            f.write(final_report)
        print("Final report saved as report.md")
    else:
        print("No final report generated.")

# Run the graph
asyncio.run(run_graph())