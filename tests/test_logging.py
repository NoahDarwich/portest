"""
Tests for the logging module.
"""


class TestLoggingModule:
    """Tests for structured logging configuration."""

    def test_logging_module_import(self):
        """Test that logging module can be imported."""
        from protest.logging import configure_logging, get_logger

        assert configure_logging is not None
        assert get_logger is not None

    def test_get_logger_returns_logger(self):
        """Test that get_logger returns a logger instance."""
        from protest.logging import configure_logging, get_logger

        configure_logging()
        logger = get_logger("test")
        assert logger is not None
        assert hasattr(logger, "info")
        assert hasattr(logger, "error")
        assert hasattr(logger, "warning")

    def test_request_context_functions(self):
        """Test request context binding functions."""
        from protest.logging import (
            bind_request_context,
            clear_request_context,
            configure_logging,
        )

        configure_logging()

        # Should not raise any exceptions
        bind_request_context(
            request_id="test-123",
            method="GET",
            path="/test",
            client_ip="127.0.0.1",
        )
        clear_request_context()
