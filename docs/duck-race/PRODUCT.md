# Quiz Duck Race product brief

Ten-minute classroom race for one projector host and up to fifty independent player clients. Vietnamese is the interface language. Questions use the existing presentation curriculum bank without changing the factory game's runtime.

The owner's latest decisions take precedence over the original river/auto-run concept: this is a ground race on grass and dirt, with continuous world-space movement, no lanes and no movement when input is released. WASD/arrows/D-pad steer, Space jumps, Shift holds crouch, E buys roll energy, F pushes a nearby opponent. Push is bounded, has a three-second cooldown and temporary victim immunity. Questions finance rolls, cards and an optional once-per-match wager; balance and movement are server-authoritative.

Host camera follows the distance leader or highest-reserve spotlight. Each player camera follows only their own duck. World is approximately 40,000px wide; it is never fitted entirely into the gameplay viewport. First finish wins; timeout uses reserve points then distance. Lobby, countdown, race and result form one reconnectable flow. Top three appears on the host result only.

The existing factory game must continue independently. New renderer/CSS, API, tokens, room keys and Redis namespace stay separate. No public deployment is authorized by this implementation task.


Horizontal-map revision: the road is now a straight 40,000px world, with continuous 520px playable breadth. Permanent seeded obstacles exist from the start along the whole course and never expire; sprites are instantiated 250px outside the viewport before reaching it, and culled behind the camera without removing server collisions. Only environment dust events use the 30-second spawn / 10-second lifetime. Fourteen authored SVG assets supply tiled ground, obstacles, labels and UI frames; original duck sprite animations remain unchanged. UI CSS arranges artwork and accessible focus/answer states. Browser evidence for this revision is design-preview/duck-race-horizontal-v2. New rooms are required; Redis room namespace advanced to v2 to avoid restoring incompatible geometry.
