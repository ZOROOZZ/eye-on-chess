import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ConfirmModal from "./ConfirmModal";

describe("ConfirmModal", () => {
  it("should not render when closed", () => {
    render(
      <ConfirmModal
        open={false}
        title="Test"
        message="Test message"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.queryByText("Test")).not.toBeInTheDocument();
  });

  it("should render title and message when open", () => {
    render(
      <ConfirmModal
        open={true}
        title="Delete user?"
        message="This is permanent"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByText("Delete user?")).toBeInTheDocument();
    expect(screen.getByText("This is permanent")).toBeInTheDocument();
  });

  it("should call onConfirm when confirm button clicked", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmModal
        open={true}
        title="Test"
        message="Test"
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    );
    fireEvent.click(screen.getByText("Delete"));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("should call onCancel when cancel button clicked", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmModal
        open={true}
        title="Test"
        message="Test"
        onConfirm={() => {}}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("should show loading state", () => {
    render(
      <ConfirmModal
        open={true}
        title="Test"
        message="Test"
        confirmLabel="Delete"
        loading={true}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByText("...")).toBeInTheDocument();
  });

  it("should disable buttons when loading", () => {
    render(
      <ConfirmModal
        open={true}
        title="Test"
        message="Test"
        loading={true}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it("should use danger variant by default", () => {
    render(
      <ConfirmModal
        open={true}
        title="Test"
        message="Test"
        confirmLabel="Delete"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    const confirmBtn = screen.getByText("Delete");
    expect(confirmBtn.className).toContain("bg-red-600");
  });

  it("should use primary variant when specified", () => {
    render(
      <ConfirmModal
        open={true}
        title="Test"
        message="Test"
        confirmLabel="OK"
        confirmVariant="primary"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    const confirmBtn = screen.getByText("OK");
    expect(confirmBtn.className).toContain("bg-blue-600");
  });
});
