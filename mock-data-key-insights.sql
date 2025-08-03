-- Mock data for key_insights table
-- User ID: 3e3eb250-b9bf-4b4f-8305-2885437fce4c
-- Note: Each meeting_id must be unique due to unique constraint

INSERT INTO public.key_insights (
    id,
    user_id,
    meeting_id,
    action_items,
    decisions,
    insight_summary,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    '3e3eb250-b9bf-4b4f-8305-2885437fce4c',
    '091c4c7f-1b33-4670-9a22-8fed9c608e2e',
    '[
        "Follow up with client on proposal by Friday",
        "Schedule team retrospective meeting for next week",
        "Review Q1 budget allocation and spending",
        "Update project documentation for new features",
        "Coordinate with marketing team on campaign launch"
    ]'::jsonb,
    '[
        "Approved new feature launch timeline for March 15th",
        "Increased marketing budget by 20% for Q1 campaign",
        "Hired additional developer for mobile app development",
        "Decided to implement new security protocols",
        "Agreed to quarterly team building events"
    ]'::jsonb,
    'The team discussed Q1 goals and project timelines. Key decisions were made regarding the new feature launch and marketing campaign. Several action items were identified for follow-up, including client proposals and budget reviews. The meeting showed strong alignment on strategic priorities.',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
),
(
    gen_random_uuid(),
    '3e3eb250-b9bf-4b4f-8305-2885437fce4c',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '[
        "Prepare technical architecture review presentation",
        "Set up development environment for new team members",
        "Create API documentation for external partners",
        "Implement automated testing pipeline",
        "Schedule code review sessions for critical features"
    ]'::jsonb,
    '[
        "Approved microservices architecture for new system",
        "Decided to use React for frontend development",
        "Agreed on AWS as primary cloud provider",
        "Established coding standards and review process",
        "Approved budget for development tools and licenses"
    ]'::jsonb,
    'Technical architecture and development processes were the main focus. The team approved the microservices approach and established clear development standards. Several technical decisions were made regarding tools and infrastructure.',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
),
(
    gen_random_uuid(),
    '3e3eb250-b9bf-4b4f-8305-2885437fce4c',
    'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    '[
        "Conduct user research for mobile app features",
        "Create wireframes for new user interface",
        "Test prototype with focus group participants",
        "Analyze user feedback and iterate design",
        "Prepare design system documentation"
    ]'::jsonb,
    '[
        "Approved minimalist design approach for mobile app",
        "Decided to prioritize user experience over feature quantity",
        "Agreed on design system implementation timeline",
        "Approved budget for user research and testing",
        "Decided to launch beta version in Q2"
    ]'::jsonb,
    'Design and user experience were the central themes. The team focused on creating a user-centric mobile app with a minimalist design approach. User research and testing were prioritized to ensure quality.',
    NOW() - INTERVAL '1 week',
    NOW() - INTERVAL '1 week'
),
(
    gen_random_uuid(),
    '3e3eb250-b9bf-4b4f-8305-2885437fce4c',
    'c3d4e5f6-g7h8-9012-cdef-345678901234',
    '[
        "Review and update security policies",
        "Conduct security audit of current systems",
        "Implement two-factor authentication for all users",
        "Create incident response plan",
        "Schedule security training for team members"
    ]'::jsonb,
    '[
        "Approved comprehensive security audit plan",
        "Decided to implement zero-trust security model",
        "Agreed on quarterly security review schedule",
        "Approved budget for security tools and training",
        "Decided to hire dedicated security specialist"
    ]'::jsonb,
    'Security was the primary concern with several critical decisions made. The team approved a comprehensive security audit and decided to implement a zero-trust model. Budget was allocated for security improvements.',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days'
),
(
    gen_random_uuid(),
    '3e3eb250-b9bf-4b4f-8305-2885437fce4c',
    'd4e5f6g7-h8i9-0123-def0-456789012345',
    '[
        "Finalize partnership agreement with vendor",
        "Negotiate pricing terms for enterprise license",
        "Review service level agreements",
        "Plan integration timeline with vendor systems",
        "Prepare vendor onboarding documentation"
    ]'::jsonb,
    '[
        "Approved partnership with leading technology vendor",
        "Decided on enterprise licensing model",
        "Agreed on 24/7 support service level",
        "Approved integration timeline for Q2",
        "Decided to allocate dedicated team for vendor integration"
    ]'::jsonb,
    'Partnership and vendor relationships were discussed extensively. The team approved a strategic partnership with key terms negotiated. Integration planning was prioritized for successful implementation.',
    NOW() - INTERVAL '2 weeks',
    NOW() - INTERVAL '2 weeks'
); 